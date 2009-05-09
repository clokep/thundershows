/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is ThunderShows Provider code.
 *
 * The Initial Developer of the Original Code is
 * 	 Patrick Cloke
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://thundershows/calThunderShowsFilter.js");
//Components.utils.import("resource://calendar/modules/calUtils.jsm");

function dump(aMessage) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
								   .getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage("ThunderShows: " + aMessage);
}

window.addEventListener("load",  function () {cTS_startUp();}, false);
window.addEventListener("unload", function () {cTS_shutDown();},  false);

function cTS_startUp() {
	// Array of Thundershows Calendars
	var thunderShowsCals = Array();

	// Array of all registered calendars
	let cals = getCalendarManager().getCalendars({});
	for each (let calendar in cals) {
		if (calendar) {
			if (calendar.type == "thundershows") {
				// If ThunderShows calendar add it to the array
				thunderShowsCals.push(calendar);
			}
		}
	}

	// Can probably be replaced with the following once STEEL lands
	// Application.extensions.get("{11b7da5a-8458-4cf6-a067-f75c19562317}");
	// See comm-central/source/mozilla/toolkit/mozapps/extensions/public/nsIExtensionManager.idl

	// Get the extension manager
	var extmgr = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
	// Find ThunderShows
	var extension = extmgr.getItemForID("{11b7da5a-8458-4cf6-a067-f75c19562317}");
	if (extension != null) {
		// If extension exists
		var extensionVersion = extension.version;

		var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
									   .getService(Components.interfaces.nsIVersionComparator);
		// Update each calendar
		// Note that this should be able to handle multiple levels of upgrade at the same time
		// I.e. 0.3 --> 0.5, not just 0.3 --> 0.4, this is done by iteratively updating each one
		for each (let calendar in thunderShowsCals) {
			//var calendarVersion = calendar.getProperty("thundershows.version");
			var calendarVersion = "0.3";

			var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
										   .getService(Components.interfaces.nsIVersionComparator);
			// Update calendar
			// Note that calendar should be able to handle multiple levels of upgrade at the same time
			// I.e. 0.3 --> 0.5, not just 0.3 --> 0.4, calendar is done by iteratively updating each one
			if (versionChecker.compare(calendarVersion, "0.4") < 0) {
				dump("Upgrading");
				// Last updated version is older than 0.4
				// API changes from 0.3 --> 0.4 must be done manually

				// Get current filters
				var filters = calendar.getProperty("thundershows.filters");
				if (filters != null) {
					// Set up array for new filters
					var newFilters = new Array();

					// If filters exist, separate them
					filters = filters.split("\u001A");

					// For each filter change from a flat string to a Filter object
					for each (let aFilter in filters) {
						newFilters.push(new Filter(aFilter, "showName", true, Filter.EQUALS, aFilter, true));
					}

					// Save new filters to the calendar
					dump(Filter.save(newFilters));
					//calendar.setProperty("thundershows.filters", Filter.save(newFilters));
				}
				
				// Get current known shows
				var knownShows = calendar.getProperty("thundershows.known_shows");
				if (knownShows != null) {
					// If known shows exist, separate them into an Array
					knownShows = knownShows.split("\u001A");
					// Save new knownShows to the calendar
					dump(JSON.stringify(knownShows));
					//calendar.setProperty("thundershows.known_shows", JSON.stringify(knownShows));
				}

			}
			/*if (versionChecker.compare(calendarVersion, "0.5") < 0) {
				// Last updated version is older than 0.5
				// API changes from 0.4 --> 0.5 must be done manually
			}*/
			dump("Done upgrading");
			// Update calendar version to extension version
			//calendar.setProperty("thundershows.version", extensionVersion);
		}
	} // End if extension exists
}

function cTS_shutDown() {}