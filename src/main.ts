import { Assignment, ButtonType } from "midi-mixer-plugin";
const HomeAssistant = require('homeassistant');


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
let hass: any;
let assignments: Assignment[] = [];
let buttons: ButtonType[] = [];



/**
 * Example of retrieving the plugin's settings.
 */
$MM.getSettings().then((settings) => {
  console.log("Current settings:", settings);
  homeassistantURL = "http://" + settings.homeassistantIP;
  authorizationToken = settings.auth as string;
 
  /**
  * Create the Homeassistant object
  */
  hass = new HomeAssistant({
    host: homeassistantURL,
    token: authorizationToken
  })

  try {
    hass.states.list().then((res: Array<any>) => {

      res.forEach(function (item: any) {

        if (item.entity_id.startsWith("light")) {
          let currentAssignment = new Assignment(item.entity_id, {
            name: item.attributes.friendly_name
          })
          // set action for mute event
          currentAssignment.on("mutePressed", async () => {
            let fullState = await hass.states.get("light", currentAssignment.id);
            let onOffState = fullState.state;
            if ((onOffState == "on") == !currentAssignment.muted) {
              hass.services.call('toggle', 'light', item.entity_id);
              currentAssignment.muted = !currentAssignment.muted;
            } else {
              currentAssignment.muted = !currentAssignment.muted;
            }
          })

          // set action for volume event
          currentAssignment.on("volumeChanged", (level: number) => {
            level = Math.round(level * 100);
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
          })

          // set delay in changes since homeassistant can't go fast
          currentAssignment.throttle = 350;

          // put it in the array
          assignments.push(currentAssignment);

        } else if (item.entity_id.startsWith("switch")) {
          let currentButton = new ButtonType(item.entity_id, {
            name: item.attributes.friendly_name
          })

          // set action for pressed event
          currentButton.on("pressed", async () => {
            let fullState = await hass.states.get("switch", currentButton.id);
            let onOffState = fullState.state;
            if ((onOffState == "on") == currentButton.active) {
              hass.services.call('toggle', 'switch', item.entity_id);
              currentButton.active = !currentButton.active;
            } else {
              currentButton.active = !currentButton.active;
            }
          })

          // put it in the array
          buttons.push(currentButton);
        }
      });
    });

  } catch (e) {
    console.log(e);
  }
  
});


/**
 * Example of setting up an assignment to be controlled by the plugin.
 */
const example = new Assignment("foo", {
  name: "Example Plugin Entry",
});

/**
 * Set the assignment's peak meter value to 50% for 150ms.
 */
example.meter = 0.5;

/**
 * Sets the minimum amount of time in milliseconds between volume change updates
 * from MIDI Mixer to 50 milliseconds.
 */
example.throttle = 500;

/**
 * When the user tries to change the volume of the assignment...
 */
example.on("volumeChanged", (level: number) => {
  /**
   * Sets the volume indicator to the new level.
   */
  example.volume = level;
});

/**
 * When the user presses the "mute" button for this assignment...
 */
example.on("mutePressed", async () => {
  /**
   * Toggles the "muted" indicator.
   */
  example.muted = !example.muted;
});

/**
 * When the user presses the "assign" button for this assignment...
 */
example.on("assignPressed", () => {
  /**
   * Toggles the "assigned" indicator.
   */
  example.assigned = !example.assigned;
});

/**
 * When the user presses the "run" button for this assignment...
 */
example.on("runPressed", () => {
  /**
   * Toggles the "running" indicator.
   */
  example.running = !example.running;
});

/**
 * Example of setting up a button type to be controlled by the plugin.
 */
const typeExample = new ButtonType("bar", {
  name: "Example Button Type",
});

/**
 * When the user presses the button...
 */
typeExample.on("pressed", () => {
  /**
   * Toggles the button's indicator.
   */
  typeExample.active = !typeExample.active;
});

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
