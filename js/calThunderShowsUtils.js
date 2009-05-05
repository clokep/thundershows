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

/**
 * @fileOverview	This file contains utility classes and functions used by
 *					{@link calThunderShows.js}
 * @name			calThunderShowsUtils.js
 * @author			Patrick Cloke (DarkJedi613@gmail.com)
 * @version			0.4
 * @license			<a href="http://www.mozilla.org/MPL/">MPL</a>
 */

/**
 * Dump a message to the Thunderbird console.
 *
 * @param	{String} aMessage	The string to print
 */
function dump(aMessage) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
								   .getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage("ThunderShows: " + aMessage);
}

/**
 * Offset a DateTime object by a number of seconds
 *
 * @param	{calIDateTime} aDateTime	The calIDateTime object to offset
 * @param	{int} aOffset				The offset time (in seconds)
 * @return	{calIDateTime}				A DateTime object offset from the given object
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
 * Pads a string by adding aPadding to the left of it until the length is aLength
 *
 * @param	{String} aPadding	A String object to pad with
 * @param	{int} aLength		The minimum length of the output String
 * @return	{String}			A String object of length aLength
 */
String.prototype.padLeft = function(aPadding, aLength) {
	var output = this.toString();
	while (output.length < aLength) {
		output = aPadding + output;
	}
	return output;
};

/**
 * Replaces HTML tags and entities with plaintext/unicode equivalents
 *
 * @return	{String}	The input String cleaned of all HTML entities
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
 * Make sure that the built in functions do not get overwritten
 * @deprecated	Since version 0.4
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
