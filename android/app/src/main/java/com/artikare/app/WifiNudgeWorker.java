package com.artikare.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Trabajo periódico (15 min, solo Wi-Fi) que replica decideNudge de
 * src/lib/reminders/smart/policy.ts: activado, sin "Silenciar hoy", fuera de
 * 22:00–07:00, bajo el tope diario, 1 por franja, nunca con el día completo y,
 * tras 3 días sin abrir, un único "Aquí estaré cuando quieras volver".
 * El texto es genérico y llega listo desde la app. No lee otras apps ni la red.
 */
public class WifiNudgeWorker extends Worker {

    private static final String CHANNEL_ID = "artiko_nudges";
    private static final int NOTIFICATION_ID = 941;
    private static final int SENT_HISTORY_LIMIT = 30;
    private static final int AFTERNOON_START = 12 * 60;
    private static final int EVENING_START = 18 * 60;
    private static final long MS_PER_DAY = 86_400_000L;

    public WifiNudgeWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        try {
            Context context = getApplicationContext();
            JSONObject state = new JSONObject(ArtikoRemindersPlugin.prefs(context).getString(ArtikoRemindersPlugin.KEY_STATE, "{}"));
            String[] nudge = decide(context, state);
            if (nudge != null) {
                post(context, state.optString("title", "Artikare"), nudge[1]);
                recordSent(context, todayInLima(), nudge[0]);
            }
        } catch (JSONException error) {
            // Estado ilegible: no se avisa (mejor callar que molestar).
        }
        return Result.success();
    }

    /** {franja, texto} si corresponde avisar ahora; null si no. */
    private String[] decide(Context context, JSONObject state) throws JSONException {
        if (!state.optBoolean("enabled", false)) return null;
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return null;
        String today = todayInLima();
        int minutes = minutesInLima();
        if (minutes >= state.optInt("quietStartMinutes", 22 * 60) || minutes < state.optInt("quietEndMinutes", 7 * 60)) return null;
        if (today.equals(state.optString("silencedOn"))) return null;
        List<String> slotsToday = slotsSentToday(context, state, today);
        if (slotsToday.size() >= state.optInt("maxPerDay", 1)) return null;
        String lastOpenedOn = state.isNull("lastOpenedOn") ? null : state.optString("lastOpenedOn", null);
        if (lastOpenedOn != null && daysBetween(lastOpenedOn, today) >= state.optInt("pauseAfterDays", 3)) {
            return pauseAlreadySent(context, lastOpenedOn) ? null : new String[] {"pause", state.optString("pauseMessage")};
        }
        int pending = today.equals(state.optString("date")) ? state.optInt("pendingMissions", 0) : 1;
        if (pending <= 0) return null;
        String slot = minutes >= EVENING_START ? "evening" : minutes >= AFTERNOON_START ? "afternoon" : "morning";
        if (slotsToday.contains(slot)) return null;
        JSONArray messages = state.getJSONObject("messages").getJSONArray(slot);
        if (messages.length() == 0) return null;
        return new String[] {slot, messages.getString((int) (epochDay(today) % messages.length()))};
    }

    private List<String> slotsSentToday(Context context, JSONObject state, String today) {
        List<String> slots = new ArrayList<>();
        JSONArray sent = ArtikoRemindersPlugin.readSent(context);
        for (int i = 0; i < sent.length(); i++) {
            JSONObject entry = sent.optJSONObject(i);
            if (entry != null && today.equals(entry.optString("date"))) slots.add(entry.optString("slot"));
        }
        JSONArray fromApp = today.equals(state.optString("date")) ? state.optJSONArray("sentSlotsToday") : null;
        for (int i = 0; fromApp != null && i < fromApp.length(); i++) slots.add(fromApp.optString(i));
        return slots;
    }

    private boolean pauseAlreadySent(Context context, String lastOpenedOn) {
        JSONArray sent = ArtikoRemindersPlugin.readSent(context);
        for (int i = 0; i < sent.length(); i++) {
            JSONObject entry = sent.optJSONObject(i);
            if (entry != null && "pause".equals(entry.optString("slot")) && entry.optString("date").compareTo(lastOpenedOn) > 0) return true;
        }
        return false;
    }

    private void recordSent(Context context, String date, String slot) throws JSONException {
        JSONArray sent = ArtikoRemindersPlugin.readSent(context);
        sent.put(new JSONObject().put("date", date).put("slot", slot));
        JSONArray trimmed = new JSONArray();
        for (int i = Math.max(0, sent.length() - SENT_HISTORY_LIMIT); i < sent.length(); i++) trimmed.put(sent.get(i));
        ArtikoRemindersPlugin.prefs(context).edit().putString(ArtikoRemindersPlugin.KEY_SENT, trimmed.toString()).apply();
    }

    private void post(Context context, String title, String body) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(new NotificationChannel(CHANNEL_ID, "Recordatorios de Artiko", NotificationManager.IMPORTANCE_DEFAULT));
        }
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent tap = open == null ? null : PendingIntent.getActivity(context, NOTIFICATION_ID, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_artiko)
            .setContentTitle(title)
            .setContentText(body)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setAutoCancel(true)
            .setContentIntent(tap);
        manager.notify(NOTIFICATION_ID, builder.build());
    }

    private static Calendar limaNow() {
        return Calendar.getInstance(TimeZone.getTimeZone("America/Lima"), Locale.US);
    }

    static String todayInLima() {
        Calendar now = limaNow();
        return String.format(Locale.US, "%04d-%02d-%02d", now.get(Calendar.YEAR), now.get(Calendar.MONTH) + 1, now.get(Calendar.DAY_OF_MONTH));
    }

    private static int minutesInLima() {
        Calendar now = limaNow();
        return now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);
    }

    /** Días desde 1970-01-01 de YYYY-MM-DD (igual que epochDay en messages.ts). */
    static long epochDay(String isoDate) {
        Calendar utc = Calendar.getInstance(TimeZone.getTimeZone("UTC"), Locale.US);
        utc.clear();
        utc.set(Integer.parseInt(isoDate.substring(0, 4)), Integer.parseInt(isoDate.substring(5, 7)) - 1, Integer.parseInt(isoDate.substring(8, 10)));
        return utc.getTimeInMillis() / MS_PER_DAY;
    }

    private static long daysBetween(String fromIso, String toIso) {
        return epochDay(toIso) - epochDay(fromIso);
    }
}
