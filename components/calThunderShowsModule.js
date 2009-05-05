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

var cTS_classInfo = {
     calThunderShows: {
        getInterfaces: function cI_cTS_getInterfaces (count) {
            var ifaces = [
                Components.interfaces.nsISupports,
                Components.interfaces.calICalendar,
                Components.interfaces.nsIClassInfo
            ];
            count.value = ifaces.length;
            return ifaces;
        },

        getHelperForLanguage: function (language) {
            return null;
        },

        classDescription: "ThunderShows Provider",
        contractID: "@mozilla.org/calendar/calendar;1?type=thundershows",
		classID:  Components.ID("{11b7da5a-8458-4cf6-a067-f75c19562317}"),
        implementationLanguage: Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT,
        constructor: "calThunderShows",
        flags: 0
    }
};

var calThunderShowsModule = {

    mUtilsLoaded: false,

	loadUtils: function cTSM_loadUtils() {
		if (this.mUtilsLoaded)
			return;

		Components.utils.import("resource://calendar/modules/calUtils.jsm");
		Components.utils.import("resource://calendar/modules/calProviderUtils.jsm");
		Components.utils.import("resource://calendar/modules/calAuthUtils.jsm");
		cal.loadScripts(["calUtils.js"], this.__parent__);

		// Now load the extension scripts. Note that unintuitively,
		// __LOCATION__.parent == . We expect to find the subscripts in ./../js
		let thisDir = __LOCATION__.parent.parent.clone();
		thisDir.append("js");
		cal.loadScripts(["calThunderShows.js", "calThunderShowsUtils.js", "calThunderShowsShow.js", "calThunderShowsFilter.js"],
						this.__parent__,
						thisDir);

		this.mUtilsLoaded = true;
	},

    unregisterSelf: function cTSM_unregisterSelf(aComponentManager) {
        aComponentManager = aComponentManager
                            .QueryInterface(Components.interfaces.nsIComponentRegistrar);
        for each (var component in cTS_classInfo) {
            aComponentManager.unregisterFactoryLocation(component.classID);
        }
    },

    registerSelf: function cTSM_registerSelf(aComponentManager,
                                             aFileSpec,
                                             aLocation,
                                             aType) {
        aComponentManager = aComponentManager
                            .QueryInterface(Components.interfaces.nsIComponentRegistrar);

        for each (var component in cTS_classInfo) {
            aComponentManager.registerFactoryLocation(
                component.classID,
                component.classDescription,
                component.contractID,
                aFileSpec,
                aLocation,
                aType);
        }
    },

    makeFactoryFor: function cTSM_makeFactoryFor(aConstructor) {
        var factory = {
            QueryInterface: function (aIID) {
                if (!aIID.equals(Components.interfaces.nsISupports) &&
                    !aIID.equals(Components.interfaces.nsIFactory))
                    throw Components.results.NS_ERROR_NO_INTERFACE;
                return this;
            },

            createInstance: function (aOuter, aIID) {
                if (aOuter != null)
                    throw Components.results.NS_ERROR_NO_AGGREGATION;
                return (new aConstructor()).QueryInterface(aIID);
            }
        };
        return factory;
    },

    getClassObject: function cTSM_getClassObject(aComponentManager,
                                                 aCID,
                                                 aIID) {
        if (!aIID.equals(Components.interfaces.nsIFactory))
            throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

        this.loadUtils();

        for each (var component in cTS_classInfo) {
            if (aCID.equals(component.classID)) {
                return this.makeFactoryFor(eval(component.constructor));
            }
        }
        throw Components.results.NS_ERROR_NO_INTERFACE;
    },

    canUnload: function(aComponentManager) {
        return true;
    }
};

function NSGetModule(aComponentManager, aFileSpec) {
    return calThunderShowsModule;
}
