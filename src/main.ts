import { Assignment, ButtonType } from "midi-mixer-plugin";


let HomeAssistant: any;
try {
  HomeAssistant = require('homeassistant');
} catch (e) {
  console.log(e);
}
/**
 * Welcome to the plugin's main file!
 *
 * As defined in your plugin's `plugin.json` file, this is the file that MIDI
 * Mixer will load when the plugin is activated by a user; this is where you
 * will define your plugin's logic.
 *
 * Below are some simple examples for retrieving settings, creating assignments,
 * and creating buttons. The rest is up to you! Have fun!
 */



let homeassistantURL = "";
let authorizationToken = "";
let refreshInterval: number;
let refreshTimer: any;
let hass: any;
let assignments = new Map<string, Assignment>();
let buttons = new Map<string, ButtonType>();



/**
 * Example of retrieving the plugin's settings.
 */
$MM.getSettings().then((settings) => {

  console.log("Current settings:", settings);
  homeassistantURL = "http://" + settings.homeassistantIP;
  authorizationToken = settings.auth as string;
  refreshInterval = settings.refresh as number;
  if (refreshInterval == null) {
    refreshInterval = 0;
  }

  try {
    /**
    * Create the Homeassistant object
    */
    hass = new HomeAssistant({
      host: homeassistantURL,
      token: authorizationToken
    })

    hass.states.list().then((res: Array<any>) => {

      res.forEach(function (item: any) {

        if (item.entity_id.startsWith("light")) {
          let currentAssignment = new Assignment(item.entity_id, {
            name: item.attributes.friendly_name
          })
          // set action for mute event
          currentAssignment.on("mutePressed", async () => {
            clearInterval(refreshTimer);
            let fullState = await hass.states.get("light", currentAssignment.id);
            let onOffState = fullState.state;
            if ((onOffState == "on") == !currentAssignment.muted) {
              hass.services.call('toggle', 'light', item.entity_id);
              currentAssignment.muted = !currentAssignment.muted;
            } else {
              currentAssignment.muted = !currentAssignment.muted;
            }
            startRefreshTimer();
          })

          // set action for volume event
          currentAssignment.on("volumeChanged", (level: number) => {
            clearInterval(refreshTimer);
            level = Math.round(level * 100);
            //console.log(level);
            hass.services.call(hass.services.call('turn_on', 'light', {
              entity_id: currentAssignment.id,
              brightness_pct: level,
              transition: 0.35
            }))
            if (level == 0) {
              currentAssignment.muted = true;
            } else {
              currentAssignment.muted = false;
            }
            startRefreshTimer();
          })

          // set delay in changes since homeassistant can't go fast
          currentAssignment.throttle = 350;

          // put it in the array
          assignments.set(currentAssignment.id, currentAssignment);

        } else if (item.entity_id.startsWith("switch")) {
          let currentButton = new ButtonType(item.entity_id, {
            name: item.attributes.friendly_name
          })

          // set action for pressed event
          currentButton.on("pressed", async () => {
            clearInterval(refreshTimer);
            let fullState = await hass.states.get("switch", currentButton.id);
            let onOffState = fullState.state;
            if ((onOffState == "on") == currentButton.active) {
              hass.services.call('toggle', 'switch', item.entity_id);
              currentButton.active = !currentButton.active;
            } else {
              currentButton.active = !currentButton.active;
            }
            startRefreshTimer();
          })

          // put it in the array
          buttons.set(currentButton.id, currentButton);
        }
      });
    });
    refreshStates();
    startRefreshTimer();
  } catch (e) {
    console.log(e);
  }
});

function startRefreshTimer() {
  if (refreshInterval != 0) {
    refreshTimer = setInterval(refreshStates, refreshInterval * 1000);
  }
}

async function refreshStates() {
  try {
    let states = await hass.states.list();
    console.log(states);
    states.forEach(function (item: any) {
      if (assignments.has(item.entity_id)) {
        let currentAssignment = assignments.get(item.entity_id);
        if (currentAssignment) {
          currentAssignment.muted = item.state != "on";
        }
      } else if (buttons.has(item.entity_id)) {
        let currentButton = buttons.get(item.entity_id);
        if (currentButton) {
          currentButton.active = item.state == "on";
        }
      }
    })
  } catch (e) {
    console.log(e);
  }
}

/**
 * Example of settings buttons and statuses to show the status of the plugin
 * on the settings page.
 *
 * We use the keys defined in the `settings` object of our `package.json` in
 * order to react to UI button presses and set resulting statuses.
 *
 * Using this is great for showing anything from "Connected" statuses to error
 * messages to your end users.
 */
$MM.onSettingsButtonPress("run", () => {
  $MM.setSettingsStatus("status", "Running...");

  setTimeout(() => {
    $MM.setSettingsStatus("status", "Done");
  }, 1000);
});


/**
 * Welcome message and informational links.
 */
console.log(
  `%c███╗   ███╗██╗██████╗ ██╗    ███╗   ███╗██╗██╗  ██╗███████╗██████╗
████╗ ████║██║██╔══██╗██║    ████╗ ████║██║╚██╗██╔╝██╔════╝██╔══██╗
██╔████╔██║██║██║  ██║██║    ██╔████╔██║██║ ╚███╔╝ █████╗  ██████╔╝
██║╚██╔╝██║██║██║  ██║██║    ██║╚██╔╝██║██║ ██╔██╗ ██╔══╝  ██╔══██╗
██║ ╚═╝ ██║██║██████╔╝██║    ██║ ╚═╝ ██║██║██╔╝ ██╗███████╗██║  ██║
╚═╝     ╚═╝╚═╝╚═════╝ ╚═╝    ╚═╝     ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`,
  "font-family:monospace;color:#4b92b9;"
);

console.log(`Welcome to the debugging tools for a MIDI Mixer plugin.
Here are a few things to try out:
- Watch this console for logs and errors
- Set breakpoints in your code in the "Sources" tab
- Profile memory usage using the "Memory" tab
- Profile CPU usage using the "Profiler" tab`);