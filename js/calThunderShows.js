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
	// Initiate some of our own things now
	this.initThunderShowsCalendar();
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
	
    
    initThunderShowsCalendar: function() {
		this.mObserver = new calThunderShowsObserver(this);
		this.addObserver(this.mObserver); // XXX Not removed
    },

	/*
	 * Member variables
	 * For use for only one session
	 */
	mObserver: null,
	mEvents: null,
	mLastUpdate: 0, // Never updated

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
			// internal preferences. Therefore return true for the readOnly property.
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
	
	/**
	 * Allows a default value to be associated with a property
	 * Do not have to check if a value exists
	 */
	getPropertySafe: function cTS_getPropertySafe(aName, aDefaultValue) {
		var property = this.getProperty(aName);
		return (property != null) ? property : aDefaultValue;
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

	deleteItem: function cTS_deleteItem(aItem, aListener) {
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
						self.mEvents = self.convertXMLToShows(request.responseXML);
						//self.mFilteredEvents = self.filterEvents(self.mEvents);
						var filteredEvents = self.filterEvents(self.mEvents, aCount, aRangeStart, aRangeEnd);
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
			var filteredEvents = this.filterEvents(this.mEvents, aCount, aRangeStart, aRangeEnd);
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
	filterEvents: function cTS_filterEvents(aShows, aCount, aRangeStart, aRangeEnd) {
		// Keep track of shows we want to display
		var filters = Filter.load(this.getPropertySafe("thundershows.filters", "[]"));
		if (filters.length == 0) {
			// No filters, can't match any shows
			return new Array();
		}

		// These properties still need to be taken into account
		var displayPilots = this.getProperty("thundershows.display_pilots");
		var useExceptions = this.getProperty("thundershows.use_exceptions");
		var isAllDayEvent = this.getProperty("thundershows.all_day_events");
		var offset = this.getProperty("thundershows.offset");
		
		// This filters all the shows to just the ones we want
		var filteredShows = Filter.filterAll(filters, aShows);
		var filteredEvents = new Array();

		for (var ithShow in filteredShows) {
			// Loop through shows we want and turn them into events
			var show = filteredShows[ithShow];
			filteredEvents.push(Show.toCalIEvent(show,
												 this,
												 aRangeStart,
												 aRangeEnd,
												 offset,
												 isAllDayEvent));
		}
		return filteredEvents;
	},
	
	/**
	 * This function parses the XML and returns useful events
	 */
	convertXMLToShows: function cTS_convertXMLToEvents(aDom) {
		// Keep track of all shows we've ever seen
		var known_shows = JSON.parse(this.getPropertySafe("thundershows.known_shows", "[]"));
		//var known_shows = new Array();
		//known_shows = (known_shows != null) ? JSON.parse(known_shows) : new Array();
		// Keep track of all networks
		var known_networks = this.getProperty("thundershows.known_networks", new AssociativeArray());
		known_networks = (known_networks != null) ? JSON.parse(known_networks) : new AssociativeArray();

		// Use xpath to get all elements with class TVEpisode
		var vevents = aDom.evaluate("//*[@_class='TVEpisode']", aDom, null, Components.interfaces.nsIDOMXPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

		var vevent;
		var shows = new Array();

		while ((vevent = vevents.iterateNext())) {
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

			// Optional Elements
			var uid = aDom.evaluate(".//id/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			var network = aDom.evaluate(".//network/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			var episode_name = aDom.evaluate(".//name/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			var season_number = aDom.evaluate(".//season/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			var episode_number = aDom.evaluate(".//episode/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
			var description = aDom.evaluate(".//episode_summary/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);

			if (network && !(network.stringValue in known_networks)) {
				// If we've never seen the network before, keep track of it
				known_networks[network.stringValue] = 0;
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
				categories.push(genre.textContent);
			}

			// These need .stringValue since the Show object expects String objects
			shows.push(new Show(uid.stringValue, show_name.stringValue, dtstart.stringValue,
					   timezone.stringValue, dtend.stringValue, network.stringValue,
					   episode_name.stringValue, season_number.stringValue, episode_number.stringValue,
					   description.stringValue, categories));
		}

		// Set known shows property with all shows found
		this.setProperty("thundershows.known_shows", JSON.stringify(known_shows.sort()));
		// Set known networks property with all networks found
		this.setProperty("thundershows.known_networks", JSON.stringify(known_networks));

		return shows;
	},
	
	/**
	 * This function updates this calendar to be compatible with the newest version of ThunderShows Provider
	 */
	update: function cTS_update() {
		// Can probably be replaced with the following once STEEL lands
		// Application.extensions.get("{11b7da5a-8458-4cf6-a067-f75c19562317}");
		// See comm-central/source/mozilla/toolkit/mozapps/extensions/public/nsIExtensionManager.idl
		
		// Don't update calendar during batch (limits recursion)
		this.mObserver.onStartBatch();

		// Get the extension manager
		var extmgr = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
		// Find ThunderShows
		var extension = extmgr.getItemForID("{11b7da5a-8458-4cf6-a067-f75c19562317}");
		if (extension != null) {
			// If extension exists (this isn't be neccessary -- must exist for the calendar to load?)
			var extensionVersion = extension.version;
			var calendarVersion = this.getPropertySafe("thundershows.version", "0.3");

			var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
										   .getService(Components.interfaces.nsIVersionComparator);
			// Update calendar
			// Note that this should be able to handle multiple levels of upgrade at the same time
			// I.e. 0.3 --> 0.5, not just 0.3 --> 0.4, this is done by iteratively updating each one
			if (versionChecker.compare(calendarVersion, "0.4pre") < 0) {
				// Last updated version is older than 0.4pre
				// API changes from 0.3.* --> 0.4pre must be done manually

				// Convert filters
				// Get current filters
				var filters = this.getPropertySafe("thundershows.filters", "");
				// Get whether exceptions are used
				var useExceptions = this.getPropertySafe("thundershows.use_exceptions", false);
				// Set up array for new filters
				var newFilters = new Array();

				// If filters exist, separate them
				filters = filters.split("\u001A");
				// For each filter change from a flat string to a Filter object
				for each (let aFilter in filters) {
					newFilters.push(new Filter(aFilter, "showName", !useExceptions, Filter.EQUALS, aFilter, true));
				}

				// Convert pilot option
				var displayPilots = this.getPropertySafe("thundershows.display_pilots", false);
				if (displayPilots) {
					// Exclude any season # greater than 1
					newFilters.push(new Filter("Exclude Season  # > 1", "seasonNumber", false, Filter.GREATER_THAN, "1", true));
					// Exclude any episode # greater than 1
					newFilters.push(new Filter("Exclude Episode # > 1", "episodeNumber", false, Filter.GREATER_THAN, "1", true));
				}

				// Save new filters to the calendar
				this.setProperty("thundershows.filters", Filter.save(newFilters));
				this.deleteProperty("thundershows.use_exceptions");
				this.deleteProperty("thundershows.display_pilots");
				
				// Get current known shows
				var knownShows = this.getProperty("thundershows.known_shows");
				if (knownShows != null) {
					// If known shows exist, separate them into an Array
					knownShows = knownShows.split("\u001A");
					// Save new knownShows to the calendar
					this.setProperty("thundershows.known_shows", JSON.stringify(knownShows));
				}

			}
			/*if (versionChecker.compare(calendarVersion, "0.5") < 0) {
				// Last updated version is older than 0.5
				// API changes from 0.4 --> 0.5 must be done manually
			}*/
		}
		
		// Update calendar version to extension version
		this.setProperty("thundershows.version", extensionVersion);

		// Allow updating calendar again
		this.mObserver.onEndBatch();
	}
};

function calThunderShowsObserver(aCalendar) {
	this.mCalendar = aCalendar;
}
calThunderShowsObserver.prototype = {
	mCalendar: null,
	mInBatch: false,

	// calIObserver:
	onStartBatch: function() {
		//this.mCalendar.observers.notify("onStartBatch");
		this.mInBatch = true;
	},
	onEndBatch: function() {
		//this.mCalendar.observers.notify("onEndBatch");
		this.mInBatch = false;
	},
	onLoad: function(calendar) {
		// Calendar has been loaded, run its update function
		calendar.update();
	},
	/*
	onAddItem: function(aItem) {
		this.mCalendar.observers.notify("onAddItem", [aItem]);
	},
	onModifyItem: function(aNewItem, aOldItem) {
		this.mCalendar.observers.notify("onModifyItem", [aNewItem, aOldItem]);
	},
	onDeleteItem: function(aDeletedItem) {
		this.mCalendar.observers.notify("onDeleteItem", [aDeletedItem]);
	},*/
	onPropertyChanged: function(aCalendar, aName, aValue, aOldValue) {
		// Necessary to have, but don't do anything
		//this.mCalendar.observers.notify("onPropertyChanged", [aCalendar, aName, aValue, aOldValue]);
	},
	onPropertyDeleting: function(aCalendar, aName) {
		//this.mCalendar.observers.notify("onPropertyDeleting", [aCalendar, aName]);
	}/*,

	onError: function(aCalendar, aErrNo, aMessage) {
		this.mCalendar.readOnly = true;
		this.mCalendar.notifyError(aErrNo, aMessage);
	}*/
};
