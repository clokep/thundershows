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
 *  Patrick Cloke
 *  Philipp Kewisch <mozilla@kewis.ch> (fromRFC3339 function)
 * Portions created by the Initial Developer are Copyright (C) 2008
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

function dump(aMessage) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
									.getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage("ThunderShows: " + aMessage);
}

/**
 * fromRFC3339
 * Convert a RFC3339 compliant Date string to a calIDateTime.
 * This function was taken from the Provider for Google Calendar
 *
 * @param aStr		  The RFC3339 compliant Date String
 * @param aTimezone	 The timezone this date string is most likely in
 * @return			  A calIDateTime object
 */
function fromRFC3339(aStr) {
	// We always want to use the default timezone for the ThunderShows Provider.
	var aTimezone = calendarDefaultTimezone();

	// XXX I have not covered leapseconds (matches[8]), this might need to
	// be done. The only reference to leap seconds I found is bug 227329.

	// Create a DateTime instance (calUtils.js)
	var dateTime = createDateTime();

	// Killer regex to parse RFC3339 dates
	var re = new RegExp("^([0-9]{4})-([0-9]{2})-([0-9]{2})" +
		"([Tt ]([0-9]{2}):([0-9]{2}):([0-9]{2})(\\.[0-9]+)?)?" + // This is edited (i.e. non-standard) to match [Tt ] instead of [Tt]
		"(([Zz]|([+-])([0-9]{2}):([0-9]{2})))?");

	var matches = re.exec(aStr);

	if (!matches) {
		return null;
	}

	// Set usual date components
	dateTime.isDate = (matches[4]==null);

	dateTime.year = matches[1];
	dateTime.month = matches[2] - 1; // Jan is 0
	dateTime.day = matches[3];

	if (!dateTime.isDate) {
		dateTime.hour = matches[5];
		dateTime.minute = matches[6];
		dateTime.second = matches[7];
	}

	// Timezone handling
	if (matches[9] == "Z") {
		// If the dates timezone is "Z", then this is UTC, no matter
		// what timezone was passed
		dateTime.timezone = UTC();
	} else if (matches[9] == null) {
		// We have no timezone info, only a date. We have no way to
		// know what timezone we are in, so lets assume we are in the
		// timezone of our local calendar, or whatever was passed.

		dateTime.timezone = aTimezone;
	} else {
		var offset_in_s = (matches[11] == "-" ? -1 : 1) *
			( (matches[12] * 3600) + (matches[13] * 60) );

		// try local timezone first
		dateTime.timezone = aTimezone;

		// If offset does not match, go through timezones. This will
		// give you the first tz in the alphabet and kill daylight
		// savings time, but we have no other choice
		if (dateTime.timezoneOffset != offset_in_s) {
			// TODO A patch to Bug 363191 should make this more efficient.

			var tzService = getTimezoneService();
			// Enumerate timezones, set them, check their offset
			var enumerator = tzService.timezoneIds;
			while (enumerator.hasMore()) {
				var id = enumerator.getNext();
				dateTime.timezone = tzService.getTimezone(id);
				if (dateTime.timezoneOffset == offset_in_s) {
					// This is our last step, so go ahead and return
					return dateTime;
				}
			}
			// We are still here: no timezone was found
			dateTime.timezone = UTC();
			if (!dateTime.isDate) {
				dateTime.hour += (matches[11] == "-" ? -1 : 1) * matches[12];
				dateTime.minute += (matches[11] == "-" ? -1 : 1) * matches[13];
			}
		}
	}
	return dateTime;
}