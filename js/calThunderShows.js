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
 * The Original Code is hCalendar Provider code.
 *
 * The Initial Developer of the Original Code is
 *   Philipp Kewisch <mozilla@kewis.ch>
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Patrick Cloke
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
 
function calThunderShows() {
	this.initProviderBase();
}

calThunderShows.prototype = {
	__proto__: cal.ProviderBase.prototype,

	QueryInterface: function cTS_QueryInterface(aIID) {
		return doQueryInterface(this,
								calThunderShows.prototype,
								aIID,
								null,
								cTS_classInfo["calThunderShows"]);
	},

	/*
	 * member variables
	 * For use for only one session
	 */
	mEvents: null,
	mLastUpdate: 0, // Never updated yet

	/*
	 * implement calICalendar
	 */
	get type cTS_getType() {
		// This is a shortname for the provider, used as unique identification.
		// This string should also be used in the UI overlay to add the
		// hCalendar option to the new calendar wizard.
		return "thundershows";
	},

	get sendItipInvitations cTS_getSendItipInvitations() {
		// This is mainly used to tell the UI if iTIP invitations should be
		// handled automatically or not. Since ThunderShows is readonly, we
		// probably don't want iTIP to be handled.
		return false;
	},

	get canRefresh cTS_getCanRefresh() {
		// This provider is remote and can be refreshed, i.e by reloading the
		// page.
		return true;
	},

	getProperty: function cTS_getProperty(aName) {
		// For complete list see http://mxr.mozilla.org/comm-central/source/calendar/base/public/calICalendar.idl
		switch (aName) {
			// This provider is generally readonly, no matter what is set in the
			// internal prefrences. Therefore return true for the readOnly property.
			case "readOnly":
				return true;
			// Unsupported capabilities
			case "capabilities.alarms.popup.supported":
			case "cache.supported":
				return false;
			// Unsupport capabilities (inverted)
			case "imip.identity.disabled":
				return true;
		}

		return this.__proto__.__proto__.getProperty.apply(this, arguments);
	},

	setProperty: function cTS_setProperty(aName, aValue) {
		switch (aName) {
			// Limitations due to being read-only
			case "readOnly":
				return true;
		}

		return this.__proto__.__proto__.setProperty.apply(this, arguments);
	},

	adoptItem: function cTS_adoptItem(aItem, aListener) {
		// Adding events is not implemented, but we need to tell the listener
		// about it, if there is one.

		if (aListener != null) {
			aListener.onOperationComplete(this.superCalendar,
										  Components.results.NS_ERROR_NOT_IMPLEMENTED,
										  Components.interfaces.calIOperationListener.ADD,
										  null,
										  "We can't add.");
		}
	},

	addItem: function cTS_addItem(aItem, aListener) {
		// There is a minimal difference between addItem and adoptItem. See
		// calICalendar.idl for details. Normally, you can just copy these
		// lines.
		return this.adoptItem( aItem.clone(), aListener );
	},

	modifyItem: function cTS_modifyItem(aNewItem, aOldItem, aListener) {
		// Modifying events is not implemented, but we need to tell the listener
		// about it, if there is one.

		if (aListener != null) {
			aListener.onOperationComplete(this.superCalendar,
										  Components.results.NS_ERROR_NOT_IMPLEMENTED,
										  Components.interfaces.calIOperationListener.MODIFY,
										  null,
										  "We can't modify.");
		}
	},

	deleteItem: function cHC_deleteItem(aItem, aListener) {
		// Deleting events is not implemented, but we need to tell the listener
		// about it, if there is one.

		if (aListener != null) {
			aListener.onOperationComplete(this.superCalendar,
										  Components.results.NS_ERROR_NOT_IMPLEMENTED,
										  Components.interfaces.calIOperationListener.DELETE,
										  null,
										  "We can't delete.");
		}
	},

	getItem: function cTS_getItem(aId, aListener) {
		// While normally this function should be implemented, its not used in
		// most cases. Also, since many pages don't include a UID, its hard to
		// permanently assign an id that can be retrieved here.
		if (aListener != null) {
			aListener.onOperationComplete(this.superCalendar,
										  Components.results.NS_ERROR_NOT_IMPLEMENTED,
										  Components.interfaces.calIOperationListener.GET,
										  null,
										  "Not needed right now.");
		}
	},

	getItems: function cTS_getItems(aItemFilter,
									aCount,
									aRangeStart,
									aRangeEnd,
									aListener) {
		if (!aListener) {
			// If there is no listener, we have no one to tell about our beloved
			// events :-)
			return;
		}

		var wantEvents = ((aItemFilter &
				Components.interfaces.calICalendar.ITEM_FILTER_TYPE_EVENT) != 0);
		if (wantEvents) {
			var lastUpdate = this.mLastUpdate;
			var currentTime = Math.floor(new Date().getTime() / 100); // Unix timestamp

			if ((lastUpdate + 60 * 29) < currentTime) {
				this.mLastUpdate = currentTime;

				//this.test_getItems(aCount, aRangeStart, aRangeEnd);
				// Use xmlHTTPRequest to retrieve the page. Do so asynchronously.
				var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
										.createInstance(Components.interfaces.nsIJSXMLHttpRequest);

				// I'd like to handle the response outside of this function, just to
				// make the code easier to read. When the request is completed, this
				// object's readyStateChange function is called.
				var self = this;
				request.onload = function() {
					var items;
					if (request.responseXML && request.responseXML.documentElement.nodeName != "parsererror") {
						// We have an xml document, just start converting
						self.mEvents = self.convertXMLToEvents(request.responseXML, aCount, aRangeStart, aRangeEnd);
						//self.mFilteredEvents = self.filterEvents(self.mEvents);
						var filteredEvents = self.filterEvents(self.mEvents);
						if (filteredEvents != null && filteredEvents.length > 0) {
							aListener.onGetResult(this.superCalendar,
												  Components.results.NS_OK,
												  Components.interfaces.calIEvent,
												  null,
												  filteredEvents.length,
												  filteredEvents);
						}
					}
					aListener.onOperationComplete(this.superCalendar,
												  Components.results.NS_OK,
												  Components.interfaces.calIOperationListener.GET,
												  null,
												  null);
					// should throw some sort of error?
				}
				request.open("GET", this.mUri.spec, true);
				// Send the request, forcing text/xml as a mime type. Until bug
				// 102699 is fixed, this is needed to get a DOM tree. The downside
				// is that pages that cannot be parsed as xml cannot be read.
				request.overrideMimeType('text/xml');
				request.send(null);
				return;
			}
			var filteredEvents = this.filterEvents(this.mEvents);
			if (filteredEvents != null && filteredEvents.length > 0) {
				aListener.onGetResult(this.superCalendar,
									  Components.results.NS_OK,
									  Components.interfaces.calIEvent,
									  null,
									  filteredEvents.length,
									  filteredEvents);
			}
		}
		aListener.onOperationComplete(this.superCalendar,
									  Components.results.NS_OK,
									  Components.interfaces.calIOperationListener.GET,
									  null,
									  null);
	},

	refresh: function cTS_refresh() {
		// When the calendar is refreshed, the observers should be notified that
		// they should update their data.
		this.mObservers.notify("onLoad", [this]);
	},

	/**
	 * This function searches the result for ThunderShow events
	 */
	filterEvents: function cTS_filterEvents(shows) {
		// Keep track of shows we want to display
		var filters = this.getProperty("thundershows.filters");
		var filteredEvents = new Array();
		
		var displayPilots = this.getProperty("thundershows.display_pilots");
		var needle = "(S01E01)";
		
		var useExceptions = this.getProperty("thundershows.use_exceptions");
		
		var allDayEvents = this.getProperty("thundershows.all_day_events");

		if (filters != null) {
			filters = filters.split("\u001A");
			for (var ithShow in shows) {
				if ((filters.indexOf(ithShow) != "-1" && !useExceptions) ||
					(useExceptions && filters.indexOf(ithShow) == "-1")) {
					// If we're looking for that show, add it as an event
					// If we're using exceptions and it isn't found, add it
					filteredEvents = filteredEvents.concat(shows[ithShow]);
				} else if (displayPilots) {
					// If we're not looking for it but its a pilot (S01E01) and
					// we're looking for all pilots than check and add if
					// necessary
					for (var ithEvent in shows[ithShow]) {
						var event = shows[ithShow][ithEvent];
						if (!event.title) {
							// Item is not an event
							continue;
						}
						var length = event.title.length;
						if (event.title.substr(length - needle.length) == needle) {
							filteredEvents.push(event);
							// Assume there can only be one pilot for a show
							break;
						}
					}
				}
			}
		}
		
		// Handle all day events
		if (allDayEvents) {
			/*for (var ithEvent in filteredEvents) {
				filteredEvents[ithEvent].startDate = offsetDateTime(filteredEvents[ithEvent].startDate, -24*60*60);
				filteredEvents[ithEvent].endDate = offsetDateTime(filteredEvents[ithEvent].endDate, -24*60*60);
				filteredEvents[ithEvent].startDate.isDate = true;
				filteredEvents[ithEvent].endDate.isDate = true;
			}*/
		}
		return filteredEvents;
	},
	
	/**
	 * This function parses the XML and returns useful events
	 */
	convertXMLToEvents: function cTS_convertXMLToEvents(aDom, aCount, aRangeStart, aRangeEnd) {
		// Keep track of all shows we've ever seen
		var known_shows = this.getProperty("thundershows.known_shows");
		known_shows = (known_shows != null) ? known_shows.split("\u001A") : new Array();
		// Keep track of all networks
		var known_networks = this.getProperty("thundershows.ksnown_networks");
		known_networks = (known_networks != null) ? JSON.parse(known_networks) : new AssociativeArray();

		// Use xpath to get all elements with class TVEpisode
		var vevents = aDom.evaluate("//*[@_class='TVEpisode']", aDom, null, Components.interfaces.nsIDOMXPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

		var vevent;
		var events = new AssociativeArray();

		while ((vevent = vevents.iterateNext())) {
			var item = createEvent();
			item.calendar = this;

			// Must get the show name
			var show_name = aDom.evaluate(".//show_name/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);

			// If we've never seen it before add it to the list
			if (known_shows.indexOf(show_name.stringValue) == "-1") {
				known_shows.push(show_name.stringValue);
			}
			
			// Required elements
			// All times are received in GMT (UTC)
			var dtstart = aDom.evaluate(".//date/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			var timezone = aDom.evaluate(".//timezone/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			var dtend = aDom.evaluate(".//enddate/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);

			if (!dtstart) {
				WARN("Event was skipped, could not find dtstart/dtend");
				continue;
			}
			
			if (timezone.stringValue != "GMT") {
				WARN("Event was skipped, cannot handle timezone ");
				continue;
			}

			// Parse dates
			try {
				item.startDate = fromRFC3339(dtstart.stringValue + "Z"); // Assume UTC time
				// Seems to be UTC even though EST in XML file, manually set it to UTC
				//item.endDate = (dtend ? fromRFC3339(dtend.stringValue + "Z").getInTimezone(UTC()) : item.startDate.clone());
				item.endDate = (dtend ? fromRFC3339(dtend.stringValue + "Z") : item.startDate.clone()); // Assume UTC time
				item.setProperty("DTSTAMP", now()); // calUtils.js

				// Show times are from EST, if PST or MST we must offset this
				var offset = this.getProperty("thundershows.offset");
				if (offset != null) {
					item.startDate = offsetDateTime(item.startDate, parseInt(offset));
					item.endDate = offsetDateTime(item.endDate, parseInt(offset));
				}
			} catch (e) {
				WARN("Event was skipped, could not convert dates: " + e);
				continue;
			}

			if (!checkIfInRange(item, aRangeStart, aRangeEnd)) {
				// calUtils has a nice range check for items, skip the item
				// if it is not in range.
				continue;
			}

			// Optional Elements
			var uid = aDom.evaluate(".//id/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			var network = aDom.evaluate(".//network/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			var episode_name = aDom.evaluate(".//name/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			var season_number = aDom.evaluate(".//season/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			var episode_number = aDom.evaluate(".//episode/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			var description = aDom.evaluate(".//episode_summary/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);

			// Parse uid, defaulting to a generic uid
			item.id = (uid.stringValue ? uid.stringValue : getUUID());

			if (network) {
				// Set the location to the network
				item.setProperty("LOCATION", network.stringValue);
				
				// If we've never seen the network before, keep track of it
				if (!(network.stringValue in known_networks)) {
					known_networks[network.stringValue] = 0;
				}
			}

			if (show_name || episode_name || season_number || episode_number) {
				item.title = show_name.stringValue + " - " + episode_name.stringValue +
							 " (S" + season_number.stringValue.padLeft('0', 2) +
							 "E" + episode_number.stringValue.padLeft('0', 2) + ")";
			} else {
				dump(network.stringValue + " " + uid);
			}

			if (description) {
				// Set the description if it exists
				// Replace HTML line breaks with Unicode line breaks
				item.setProperty("DESCRIPTION", description.stringValue.replace("<br />", "\r\n"));
			}

			// Genres (Categories)
			var categories = new Array();
			categories.push("TV show");
			// Handle individual genre
			var genre = aDom.evaluate(".//genres[@_type='string']/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			if (genre.stringValue.length > 0) {
				categories.push(genre.stringValue);
			}
			// Handle multiple genres
			var genres = aDom.evaluate(".//genres[@_type='array']/*", vevent, null, Components.interfaces.nsIDOMXPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
			while ((genre = genres.iterateNext())) {
				categories.push(genre.textContent );
			}
			// Set genres to item
			item.setCategories(categories.length, categories);

			item.makeImmutable();
			if (show_name.stringValue in events) {
				// Don't want to overwrite shows that may be in there already
				events[show_name.stringValue].push(item);
			} else {
				events[show_name.stringValue] = new Array(item);
			}
		}

		// Set known shows property with all shows found
		this.setProperty("thundershows.known_shows", known_shows.sort().join('\u001A'));
		// Set known networks property with all networks found
		this.setProperty("thundershows.known_networks", JSON.stringify(known_networks));
		return events;
	}
};
