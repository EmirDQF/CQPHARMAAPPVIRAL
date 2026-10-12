package com.artikare.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins locales del proyecto: se registran antes de crear el puente.
        registerPlugin(ArtikoRemindersPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
