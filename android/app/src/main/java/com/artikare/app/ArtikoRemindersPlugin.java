package com.artikare.app;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.concurrent.TimeUnit;

/**
 * Plugin mínimo de Artikare para el aviso por Wi-Fi en segundo plano.
 * La app (src/lib/native/artikoReminders.ts) entrega el estado del día y los
 * textos genéricos ya listos; aquí solo se guardan en SharedPreferences
 * (sin datos de salud) y se programa un trabajo periódico de WorkManager
 * (15 min, solo con red sin tarifa: Wi-Fi). Las reglas viven en WifiNudgeWorker.
 */
@CapacitorPlugin(name = "ArtikoReminders")
public class ArtikoRemindersPlugin extends Plugin {

    static final String PREFS = "artiko_reminders";
    static final String KEY_STATE = "state";
    static final String KEY_SENT = "sent";
    static final String WORK_NAME = "artiko-wifi-nudge";
    private static final long PERIOD_MINUTES = 15;

    @PluginMethod
    public void configure(PluginCall call) {
        JSObject state = call.getData();
        Context context = getContext();
        prefs(context).edit().putString(KEY_STATE, state.toString()).apply();
        if (state.optBoolean("enabled", false)) {
            schedule(context);
        } else {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME);
        }
        call.resolve();
    }

    @PluginMethod
    public void getSent(PluginCall call) {
        JSObject result = new JSObject();
        try {
            result.put("sent", new JSArray(prefs(getContext()).getString(KEY_SENT, "[]")));
        } catch (JSONException error) {
            result.put("sent", new JSArray());
        }
        call.resolve(result);
    }

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** KEEP: reconfigurar no reinicia el reloj del trabajo periódico. */
    static void schedule(Context context) {
        Constraints constraints = new Constraints.Builder().setRequiredNetworkType(NetworkType.UNMETERED).build();
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(WifiNudgeWorker.class, PERIOD_MINUTES, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build();
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request);
    }

    static JSONArray readSent(Context context) {
        try {
            return new JSONArray(prefs(context).getString(KEY_SENT, "[]"));
        } catch (JSONException error) {
            return new JSONArray();
        }
    }
}
