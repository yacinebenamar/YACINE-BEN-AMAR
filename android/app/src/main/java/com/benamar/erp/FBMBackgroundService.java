package com.benamar.erp;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * FBM Background Keep-Alive Service
 *
 * This Foreground Service keeps the app process alive when minimized,
 * allowing Firebase Firestore listeners (in WebView JS) to continue firing
 * and scheduling LocalNotifications that appear in the status bar.
 *
 * This is the same technique used by WhatsApp, Telegram, and Snapchat
 * to maintain background connectivity.
 */
public class FBMBackgroundService extends Service {

    private static final String CHANNEL_ID       = "fbm-keepalive-channel";
    private static final String CHANNEL_NAME     = "FBM - نظام متصل";
    private static final int    NOTIF_ID         = 9001;

    @Override
    public void onCreate() {
        super.onCreate();
        try {
            if (com.google.firebase.FirebaseApp.getApps(this).isEmpty()) {
                com.google.firebase.FirebaseOptions options = new com.google.firebase.FirebaseOptions.Builder()
                    .setProjectId("ben-amar-erp")
                    .setApplicationId("1:446005687299:android:4b8a1c90c749021b6e4a36")
                    .setApiKey("AIzaSyCBoD-WuzL4ZoicKk4tFEU8khaYxy7Krlg")
                    .setGcmSenderId("446005687299")
                    .build();
                com.google.firebase.FirebaseApp.initializeApp(this, options);
                System.out.println("[FBM SERVICE] Programmatic FirebaseApp initialized successfully in FBMBackgroundService.");
            } else {
                System.out.println("[FBM SERVICE] FirebaseApp already initialized in FBMBackgroundService.");
            }
        } catch (Exception e) {
            System.err.println("[FBM SERVICE] Failed to initialize FirebaseApp in FBMBackgroundService: " + e.getMessage());
        }
        createKeepAliveChannel();
        startForeground(NOTIF_ID, buildPersistentNotification());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // If the service is killed, restart it automatically
        return START_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // Re-schedule service if user swipes app away from recents
        Intent restartIntent = new Intent(getApplicationContext(), FBMBackgroundService.class);
        restartIntent.setPackage(getPackageName());
        startService(restartIntent);
        super.onTaskRemoved(rootIntent);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // ─── Notification Channel (required for Android 8+) ──────────────────────
    private void createKeepAliveChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_MIN  // Minimal — no sound/vibration for keep-alive
            );
            channel.setDescription("نظام FBM متصل بالخادم");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_SECRET);

            NotificationManager mgr = getSystemService(NotificationManager.class);
            if (mgr != null) {
                mgr.createNotificationChannel(channel);
            }
        }
    }

    // ─── Persistent Notification (small, unobtrusive) ────────────────────────
    private Notification buildPersistentNotification() {
        Intent tapIntent = new Intent(this, MainActivity.class);
        tapIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, tapIntent,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FBM ERP")
            .setContentText("النظام متصل ومستعد لاستقبال التنبيهات")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)      // Can't be dismissed by user swipe
            .setSilent(true)       // No sound for this keep-alive notification
            .setVisibility(NotificationCompat.VISIBILITY_SECRET)  // Hidden on lock screen
            .build();
    }
}
