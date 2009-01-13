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
 *  Patrick Cloke
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
	__proto__: calProviderBase.prototype,

	QueryInterface: function cTS_QueryInterface(aIID) {
		return doQueryInterface(this,
								calThunderShows.prototype,
								aIID,
								null,
								cTS_classInfo["calThunderShows"]);
	},

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
		
		try {
			// return occurrences? what does this do?
			var itemReturnOccurrences = ((aItemFilter &
				Components.interfaces.calICalendar.ITEM_FILTER_CLASS_OCCURRENCES) != 0);

			// Use xmlHTTPRequest to retrieve the page. Do so asynchronously.
			var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
									.createInstance(Components.interfaces.nsIJSXMLHttpRequest);

			// I'd like to handle the response outside of this function, just to
			// make the code easier to read. When the request is completed, this
			// object's readyStateChange function is called.
			var self = this;
			request.onreadystatechange = function() {
				self.readyStateChange(request, aListener, aCount, aRangeStart, aRangeEnd, aItemFilter);
			};

			// Send the request, forcing text/xml as a mime type. Until bug
			// 102699 is fixed, this is needed to get a DOM tree. The downside
			// is that pages that cannot be parsed as xml cannot be read, but
			// since this is only a demo, thats ok.
			request.open("GET", this.mUri.spec, true);
			request.overrideMimeType('text/xml');
			request.send(null);
		} catch (e) {
			aListener.onOperationComplete(this.superCalendar,
										  e.result,
										  Components.interfaces.calIOperationListener.GET,
										  null,
										  e.message);
		}
	},

	readyStateChange: function cHC_readyStateChange(aRequest, aListener, aCount, aRangeStart, aRangeEnd, aItemFilter) {
		if (aRequest.readyState != 4) {
			// Only continue if loading is complete
			return;
		}
		var status;
		try {
			// File urls will have status == 0, so default to 200.
			status = aRequest.status || 200;
		} catch (e) {
			// If the status is not available, we are pre-response (redirect?).
			// Just ignore this
			return;
		}

		if (status / 100 == 2) {
			if (aRequest.responseXML && aRequest.responseXML.documentElement.nodeName != "parsererror") {
				// We have an xml document, just start converting
				this.convertXmlToCalendar(aRequest.responseXML, aListener, aCount, aRangeStart, aRangeEnd, aItemFilter);
			} else {
				// Its html or garbage. We don't currently support html,
				// although it would be possible with bug 102699 or a hidden
				// iframe.
				aListener.onOperationComplete(this.superCalendar,
											  Components.results.NS_ERROR_FAILURE,
											  Components.interfaces.calIOperationListener.GET,
											  null,
											  "Parser Error");
			}
		} else {
			// An error happened, or something we don't handle.
			aListener.onOperationComplete(this.superCalendar,
										  Components.results.NS_ERROR_FAILURE,
										  Components.interfaces.calIOperationListener.GET,
										  null,
										  "HTTP " + aRequest.status + " encountered");
		}
	},

	refresh: function cTS_refresh() {
		// When the calendar is refreshed, the observers should be notified that
		// they should update their data.
		this.mObservers.notify("onLoad", [this]);
	},

	/**
	 * This function searches the result for ThunderShow events
	 */
	convertXmlToCalendar: function cTS_convertXmlToCalendar(dom, aListener, aCount, aRangeStart, aRangeEnd, aItemFilter) {
		// some getItems calls only want todos, others only want events. Differentiate here.
		var wantEvents = ((aItemFilter &
				Components.interfaces.calICalendar.ITEM_FILTER_TYPE_EVENT) != 0);

		var filters = this.getProperty("thundershows.filters");

		if (filters == null) {
			aListener.onOperationComplete(this.superCalendar,
										  Components.results.NS_OK,
										  Components.interfaces.calIOperationListener.GET,
										  null,
										  "Not looking for any shows.");
		} else if (wantEvents) {
			// Use xpath to get all elements with class vevent
			var vevents = dom.evaluate("//*[@_class='TVEpisode']", dom, null, Components.interfaces.nsIDOMXPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

			var vevent;
			var items = new Array();

			filters = filters.split("\u001A");
			
			while ((vevent = vevents.iterateNext())) {
				// Must get the show name
				var show_name = dom.evaluate(".//show_name/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
				if (filters.indexOf(show_name.stringValue) != "-1") {
					var item = createEvent();
					item.calendar = this;
					
					// Required elements
					var dtstart = dom.evaluate(".//date/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
					var timezone = dom.evaluate(".//timezone/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
					// This seems to return the UTC time even though its EST in the XML
					var dtend = dom.evaluate(".//enddate/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);

					if (!dtstart) {
						WARN("Event was skipped, could not find dtstart/dtend");
						continue;
					}

					// Parse dates
					try {
						item.startDate = fromRFC3339(dtstart.stringValue + "Z"); // Using the UTC time
						// Seems to be UTC even though EST in XML file, manually set it to UTC
						item.endDate = (dtend ? fromRFC3339(dtend.stringValue + "Z").getInTimezone(UTC()) : item.startDate.clone());
						item.setProperty("DTSTAMP", now()); // calUtils.js
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
					var uid = dom.evaluate(".//id/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
					var network = dom.evaluate(".//network/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
					//var show_name = dom.evaluate(".//show_name/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
					var episode_name = dom.evaluate(".//name/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
					var season_number = dom.evaluate(".//season/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
					var episode_number = dom.evaluate(".//episode/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
					var description = dom.evaluate(".//episode_summary/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);

					// Parse uid, defaulting to a generic uid
					item.id = (uid.stringValue ? uid.stringValue : getUUID());
					if (network) { // channel
						item.setProperty("LOCATION", network.stringValue);
					}
					if (show_name || episode_name || season_number || episode_number) {
						item.title = show_name.stringValue + " - " + episode_name.stringValue + " (S" + season_number.stringValue + "E" + episode_number.stringValue + ")";
					}
					if (description) {
						item.setProperty("DESCRIPTION", description.stringValue);
					}
					
					// Genres (Categories)
					var categories = new Array();
					categories.push("TV show");
					// Handle individual genre
					var genre = dom.evaluate(".//genres/child::text()", vevent, null, Components.interfaces.nsIDOMXPathResult.STRING_TYPE, null);
					if (genre) {
						categories.push(genre.stringValue);
					}
					// Handle multiple genres
					var genres = dom.evaluate(".//genres/*", vevent, null, Components.interfaces.nsIDOMXPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
					while ((genre = genres.iterateNext())) {
						categories.push(genre.textContent );
					}
					// Set genres to item
					item.setCategories(categories.length, categories);

					item.makeImmutable();
					items.push(item);
				}
			}
			aListener.onGetResult(this.superCalendar,
								  Components.results.NS_OK,
								  Components.interfaces.calIEvent,
								  null,
								  items.length,
								  items);
		}

		// Signal successful completion
		aListener.onOperationComplete(this.superCalendar,
									  Components.results.NS_OK,
									  Components.interfaces.calIOperationListener.GET,
									  null,
									  null);
	}
};
