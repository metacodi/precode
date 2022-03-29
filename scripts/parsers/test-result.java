package com.exceltaxisantcugat.user;

import android.os.Bundle;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Initializes the Bridge
    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
      // Additional plugins you've installed go here
      add(SpeechRecognition.class);
      add(FCMPlugin.class);
    }});
  }
}
