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
 *  Chris Pederick (http://chrispederick.com/work/web-developer/)
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
 * offsetDateTime
 * Offset a calIDateTime object by aOffset number of seconds
 *
 * @param aDateTime	  The DateTime object
 * @param aOffset	  The offset (in seconds)
 * @return			  A calIDateTime object
 */
function offsetDateTime(aDateTime, aOffset) {
	if (!aDateTime.isDate && aOffset != 0) {
		// Only if it has a time component
		aDateTime.resetTo(aDateTime.year,
						  aDateTime.month,
						  aDateTime.day,
						  aDateTime.hour,
						  aDateTime.minute,
						  aDateTime.second + aOffset,
						  aDateTime.timezone);
	}
	return aDateTime;
}

/**
 * padLeft
 * Pads a string by adding aPadding to the left of it
 *
 * @param aPadding	A String object to pad with
 * @param aLength	The minimum length of the output String
 */
String.prototype.padLeft = function(aPadding, aLength) {
	var output = this.toString();
	while (output.length < aLength) {
		output = aPadding + output;
	}
	return output;
};

/**
 * convertHTMLToPlainText
 * Replaces HTML tags and entities with plaintext/unicode equivalents
 */
String.prototype.convertHTMLToPlainText = function() {
	var output = this.toString();
	// HTML Tags
	output = output.replace(/<br *\/?>/g, "\r\n"); // Line breaks
	output = output.replace(/<(em|i)>([\w\W]+?)<\/\1>/g, "/$2/"); // Italics
	output = output.replace(/<(strong|b)>([\w\W]+?)<\/\1>/g, "*$2*"); // Bold
	output = output.replace(/<u>([\w\W]+?)<\/\1>/g, "_$2_"); // Underline
	output = output.replace(/<a.+?(?:href="(.+)")?.*?>([\w\W]+)<\/a>/g, "$2 (Source: $1)"); // Links
	
	output = output.replace(/<sup>(.+)<\/\1>/g, "\u02C4$2\u02C4"); // Superscript
	output = output.replace(/<sup>(.+)<\/\1>/g, "\u02C5$2\u02C5"); // Subscript

	// HTML Entities
	output = output.replace(/&mdash;/, "\u2014"); // Em Dash
	output = output.replace(/&amp;/, "&"); // Ampersand

	// Clean up a bit
	output = output.replace(/[(?:\r\n)]{3,}/g, "\r\n\r\n"); // Max of two line breaks in a row
	return output;
};

/**
 * Associate array object
 * Make sure that the built in functions do not get overwritten
 */
function AssociativeArray() {}
AssociativeArray.prototype = {
	length: function _length() {
		var count = 0;
		for (ithObj in this) {
			count++;
		}
		// This must be changed to the number of functions built into the class
		count -= 2;
		return count;
	},

	toString: function _toString() {
		return this.toSource();
	}
};

/**
 * Show object
 */
function Show(uid, show_name, start_time, timezone, end_time, network, episode_name,
			  season_number, episode_number, description, /* Array */ genres) {
	this.uid = uid;
	this.show_name = show_name;
	this.start_time = start_time;
	this.timezone = timezone;
	this.end_time = end_time;
	this.network = network;
	this.episode_name = episode_name;
	this.season_number = season_number;
	this.episode_number = episode_number;
	this.description = description;
	this.genres = genres;
}
Show.prototype = {
	toICalEvent: function _toCalIEvent(aCalendar, aRangeStart, aRangeEnd, aOffset, isAllDayEvent) {
		/*dump(this.show_name + "\n" + this.start_time + "\n" + this.timezone + "\n" + this.end_time + "\n"
			 + this.network + "\n" + this.episode_name + "\n" + this.season_number + "\n" +
			 this.episode_number + "\n" + this.description + "\n" + this.genres);
		return;*/
		var item = createEvent();
		item.calendar = aCalendar;

		// Parse dates
		try {
			//item.startDate = fromRFC3339(this.start_time + "Z"); // Assume UTC time
			item.startDate = cal.fromRFC3339(this.start_time.replace(' ', 'T') + "Z"); // Assume UTC time
			// Seems to be UTC even though EST in XML file, manually set it to UTC
			//item.endDate = (end_time ? fromRFC3339(end_time + "Z").getInTimezone(UTC()) : item.startDate.clone());
			//item.endDate = (this.end_time ? fromRFC3339(this.end_time + "Z") : item.startDate.clone()); // Assume UTC time
			item.endDate = (this.end_time ? cal.fromRFC3339(this.end_time.replace(' ', 'T') + "Z") : item.startDate.clone()); // Assume UTC time
			item.setProperty("DTSTAMP", now()); // calUtils.js

			if (isAllDayEvent) {
				//dump("Start: " + item.startDate + "\n" + item.endDate);
				// Handle all day events
				item.startDate = offsetDateTime(item.startDate, -24*60*60);
				item.startDate.hour = 0;
				item.startDate.minute = 0;
				item.startDate.second = 0;
				// From: calendar/base/public/calIEvent.idl
				//   Note that for all-day events, non-inclusive means that this
				//   will be set to the day after the last day of the event.
				item.endDate = item.startDate.clone();
				item.endDate.resetTo(item.endDate.year,
									 item.endDate.month,
									 item.endDate.day + 1,
									 item.endDate.hour,
									 item.endDate.minute,
									 item.endDate.second,
									 item.endDate.timezone);
				// Setting hour/minute/second is illegal operation if isDate is
				// true
				// See: calendar/base/public/calIDateTime.idl
				item.startDate.isDate = true;
				item.endDate.isDate = true;
				//dump("End: " + item.startDate + "\n" + item.endDate);
			} else if (aOffset != null) {
				// Show times are from EST, if PST or MST we must offset this
				item.startDate = offsetDateTime(item.startDate, parseInt(aOffset));
				item.endDate = offsetDateTime(item.endDate, parseInt(aOffset));
			}
		} catch (e) {
			WARN("Event was skipped, could not convert dates: " + e);
			return null;
		}

		if (!checkIfInRange(item, aRangeStart, aRangeEnd)) {
			// calUtils has a nice range check for items, skip the item
			// if it is not in range.
			return null;
		}

		// Parse uid, defaulting to a generic uid
		item.id = (this.uid ? this.uid : getUUID());
		
		if (this.network) {
			// Set the location to the network
			item.setProperty("LOCATION", this.network);
		}

		if (this.show_name || this.episode_name || this.season_number || this.episode_number) {
			item.title = this.show_name + " - " + this.episode_name +
						 " (S" + this.season_number.padLeft('0', 2) +
						 "E" + this.episode_number.padLeft('0', 2) + ")";
		}

		if (this.description) {
			// Set the description if it exists
			// Replace HTML line breaks with Unicode line breaks
			item.setProperty("DESCRIPTION", this.description.convertHTMLToPlainText());
		}

		// Set genres to item
		// Don't need to check if it exists:
		//   This will always exist with at least "TV Shows" in it
		item.setCategories(this.genres.length, this.genres);

		item.makeImmutable();
		return item;
	}
};

/**
 * Filter object
 */
function Filter(isExclusion, property, type, expression) {
	this.isExclusion = isExclusion;
	this.property = property;
	this.type = type;
	this.expression = expression;
}
Filter.prototype = {
	/*
	 * Returns whether the give show matches the object
	 * @param	aShow	An instance of a Show object
	 * @return	bool
	 */
	match: function _match(aShow) {
		return false;
	}
};





var props = {"username" : "", "password" : "", "sub_login" : "Account Login"};
var url = "http://on-my.tv/";
var params = "";
for (var i in props) {
	if (params != "") {
		params += "&";
	}
	params += i + "=" + encodeURIComponent(props[i]);
}
dump(params);
var http = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
					 .createInstance(Components.interfaces.nsIJSXMLHttpRequest);
http.open("POST", url, true);

var cookie = webdeveloper_getCookies("." + url.substr("http://".length), "/", false)[0];
var cookie_str;
if (cookie) {
	cookie_str = cookie.name + "=" + encodeURIComponent(cookie.value);
	dump(cookie_str);
	http.setRequestHeader("Cookie", cookie_str);
}

//Send the proper header information along with the request
http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
http.setRequestHeader("Content-length", params.length);
http.setRequestHeader("Connection", "close");
http.onload = function() {
	dump(http.status + " " + http.statusText);
	dump(http.responseText);
}
http.send(params);



var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
						.createInstance(Components.interfaces.nsIJSXMLHttpRequest);
request.open("GET", "http://next.seven.days.on-my.tv/?xml", true);
if (cookie) {
	dump("XML: " + cookie_str);
	request.setRequestHeader("Cookie", cookie_str);
}
request.onload = function() {
	if (request.responseXML && request.responseXML.documentElement.nodeName != "parsererror") {
		dump("XML!");
	}
	dump(request.responseText);
}
// Send the request, forcing text/xml as a mime type. Until bug
// 102699 is fixed, this is needed to get a DOM tree. The downside
// is that pages that cannot be parsed as xml cannot be read.
request.overrideMimeType('text/xml');
request.send(null);


// From the Web Developer extension (http://chrispederick.com/work/web-developer/)
// From /chrome/content/webdeveloper/common/cookie.js
// Get the cookies
function webdeveloper_getCookies(host, path, sort)
{
    var cookies = new Array();

    // If the host is set
    if(host)
    {
        var cookie            = null;
        var cookieEnumeration = Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager).enumerator;
        var cookieHost        = null;
        var cookiePath        = null;

        // Loop through the cookies
        while(cookieEnumeration.hasMoreElements())
        {
            cookie = cookieEnumeration.getNext().QueryInterface(Components.interfaces.nsICookie);

            cookieHost = cookie.host;
            cookiePath = cookie.path;

            // If there is a host and path for this cookie
            if(cookieHost && cookiePath)
            {
                // If the cookie host starts with '.'
                if(cookieHost.charAt(0) == ".")
                {
                    cookieHost = cookieHost.substring(1);
                }

                // If the host and cookie host and path and cookie path match
                if((host == cookieHost || host.indexOf("." + cookieHost) != -1) && (path == cookiePath || path.indexOf(cookiePath) == 0))
                {
                    cookies.push(cookie);
                }
            }
        }

        // If sorting cookies
        if(sort)
        {
            //cookies.sort(webdeveloper_sortCookies);
        }
    }

    return cookies;
}
