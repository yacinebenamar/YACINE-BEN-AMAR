package com.benamar.erp;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                FirebaseOptions options = new FirebaseOptions.Builder()
                    .setProjectId("ben-amar-erp")
                    .setApplicationId("1:446005687299:android:4b8a1c90c749021b6e4a36")
                    .setApiKey("AIzaSyCBoD-WuzL4ZoicKk4tFEU8khaYxy7Krlg")
                    .setGcmSenderId("446005687299")
                    .build();
                FirebaseApp.initializeApp(this, options);
                System.out.println("[FBM APP] Programmatic FirebaseApp initialized successfully in MainActivity.");
            } else {
                System.out.println("[FBM APP] FirebaseApp already initialized in MainActivity.");
            }
        } catch (Exception e) {
            System.err.println("[FBM APP] Failed to initialize FirebaseApp in MainActivity: " + e.getMessage());
        }
    }
}
