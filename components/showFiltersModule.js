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
 * The Original Code is Auto Complete My Domain.
 *
 * The Initial Developer of the Original Code is
 * Neil Rashbrook.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Patrick Cloke
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

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

// Implements nsIAutoCompleteSearch
function nsAutoCompleteShowFilters() {}

nsAutoCompleteShowFilters.prototype = {
	classDescription: "nsAutoCompleteShowFilters",
	contractID: "@mozilla.org/autocomplete/search;1?name=show-filters",
	classID: Components.ID("{5b259db2-e451-4de9-8a6f-cfba91402970}"),
	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIAutoCompleteSearch]),

	cachedParam: "",
	cachedIdentity: null,

	/**
	 * Search for a given string and notify a listener (either synchronously
	 * or asynchronously) of the result
	 *
	 * @param aString	The string to search for
	 * @param aParam	An extra parameter (searchParam or
	 *					autocompletesearchparam of element)
	 * @param aResult	A previous result to use for faster searchinig
	 * @param aListener	A listener to notify when the search is complete
	 */
	startSearch: function(aString, aParam, aResult, aListener) {
		const ACR = Components.interfaces.nsIAutoCompleteResult;

		//var known_shows = "Chuck\u001AChuckles\u001ANo match\u001AChuckkkkk".split("\u001A");
		var known_shows = aParam.split("\u001A");
		var matches = new Array();
		for (var i = 0; i < known_shows.length; i++) {
			if (known_shows[i].indexOf(aString) != -1) {
				matches.push(known_shows[i]);
			}
		}

		// (Could) implement nsIAutoCompleteResult
		var result = {
			/**
			 * The original search string
			 */
			searchString: aString,

			/**
			 * The result code of this result object, either:
			 *		 RESULT_IGNORED	 (invalid searchString)
			 *		 RESULT_FAILURE	 (failure)
			 *		 RESULT_NOMATCH	 (no matches found)
			 *		 RESULT_SUCCESS	 (matches found)
			 */
			searchResult: matches.length > 0 ? ACR.RESULT_SUCCESS : ACR.RESULT_NOMATCH,

			/**
			 * Index of the default item that should be entered if none is selected
			 */
			defaultIndex: 0,

			/**
			 * A string describing the cause of a search failure
			 */
			errorDescription: null,

			 /**
			 matchCount()
			 * The number of matches
			 */
			matchCount: matches.length,

			/**
			 * Get the value of the result at the given index
			 */
			getValueAt: function(aIndex) { return matches[aIndex]; },

			/**
			 * Get the comment of the result at the given index
			 */
			getCommentAt: function() { return null; },

			/**
			 * Get the style hint for the result at the given index
			 */
			getStyleAt: function() { return "default-match"; },

			/**
			 * Get the image for the result at the given index
			 * The return value is expected to be an URI to the image to display
			 */
			getImageAt: function() { return null; },

			/**
			 * Remove the value at the given index from the autocomplete results.
			 * If removeFromDb is set to true, the value should be removed from
			 * persistent storage as well.
			 */
			removeValueAt: function() {}
		};
		aListener.onSearchResult(this, result);
	},

	/**
	 * Stop an asynchronous search that is in progress
	 */
	stopSearch: function() {}
};

function NSGetModule(compMgr, fileSpec) {
	return XPCOMUtils.generateModule([nsAutoCompleteShowFilters]);
}
