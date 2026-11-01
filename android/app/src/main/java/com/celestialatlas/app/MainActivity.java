package com.celestialatlas.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /** Must match MORNING_CHANNEL_ID in lib/push/messages.ts. */
    static final String MORNING_CHANNEL_ID = "morning_reading";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createMorningChannel();
    }

    /** Localised by the system from res/values-xx/strings.xml. */
    private void createMorningChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
            MORNING_CHANNEL_ID,
            getString(R.string.morning_channel_name),
            NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription(getString(R.string.morning_channel_description));
        manager.createNotificationChannel(channel);
    }
}
