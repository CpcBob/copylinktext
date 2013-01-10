/*globals require, exports*/

/*
SDK modifications
1. To ensure Unicode escaping (for \u0020-end-of-line-space escaping) is ok for all locales on joining of alt links and select options, I added the following line to /python-lib/cuddlefish/property_parser.py (and compiled to property_parser.pyc):
    val = val.encode('raw-unicode-escape').decode('raw-unicode-escape')
    see also: 
    http://effbot.org/zone/unicode-objects.htm
    http://www.python.org/dev/peps/pep-0100/
2. (May also include widget.js modification for AsYouWish)

Todos:

1. Copy only alt text option
2. Fix non-links (and ensure \u0020 is ok (for all locales))
    a. Add back img in way that doesn't cause duplicates when image inside of link
    b. Move non-links to separate add-on?
    c. Option to right-click to immediately get dialog, or to get as context menu? (to avoid interfering with app. behavior for right-click)

1. Track (recover old feature): accesskey for context menus: https://bugzilla.mozilla.org/show_bug.cgi?id=828113; then ask the following as follow-ups
2. Track fix for Unicode (\u0020 in package.json): https://bugzilla.mozilla.org/show_bug.cgi?id=825803 (then remove my custom changes/upgrade SDK without the patch)
3. Propose or implement JSON array type preference rendered as multiple select
4. Propose or implement JSON object type preference accessible/settable without conversion to string
5. Propose or implement (recover old feature): Allow package.json preferences to indicate dependencies (e.g., if one is enabled, it will disable another pref.); though one can workaround by using radio buttons, sometimes less elegant
6. Propose or implement: Prompts to SDK API (to avoid need for chrome)? (Also Door-hanger Notifications for asyouwish)
    
Possible todos:
1. Refactor context menu postMessage or on* listeners to work declaratively with JSON setPrefs
2. Could try to make work with main browser XUL
*/

(function () {
'use strict';

var linkCm, otherCm,
    chrome = require('chrome'),
    Cc = chrome.Cc, Ci = chrome.Ci,
    cm = require('context-menu'),
    data = require('self').data,
    simplePrefs = require('simple-prefs'),
    prefs = simplePrefs.prefs,
    clipboard = require('clipboard'),
    _ = require('l10n').get;

/**
 * Copy some text (in Unicode-friendly fashion) to the clipboard
 * @param {String} copytext The text to copy to the clipboard
 */
function copyToClipboard (copytext) {
    return clipboard.set(copytext, 'text');
}

function getCopyTextFromPrompt (value, textContent, labelText) {
    var selected = {},
        items = [
            _("textFormat", textContent),
            _("valueFormat", value),
            _("textAndValue")
        ],
        prompts = Cc['@mozilla.org/embedcomp/prompt-service;1'].getService(Ci.nsIPromptService);
    if (labelText) {
        items.push(_("labelFormat", labelText));
    }
    prompts.select(null, _("copySelectPromptTitle"), // docEv.target.defaultView
                                    _("copySelectPromptInstructions"), items.length, items, selected);
    switch(selected.value) {
        case 0: return textContent;
        case 1: return value;
        case 2: return value === textContent ?
                value :
                _("textAndValueFormat", textContent, value);
        case 3: return labelText;
    }
}

function stringify (cfg) {
    return JSON.stringify(cfg);
}

function setProperty (cm, prop, value) {
    var obj = JSON.parse(cm.data);
    obj[prop] = value;
    cm.data = stringify(obj);
}

function setByPref (pref) {
    switch(pref) {
        case 'accessFormControls':
            setProperty(otherCm, pref, prefs[pref]);
            break;
        case 'accessPass':
            setProperty(otherCm, pref, prefs[pref]);
            break;
        case 'showAltText':
            setProperty(linkCm, pref, prefs[pref]);
            break;
        default:
            throw 'Unknown pref supplied to setByPref ' + pref;
    }
}

// This is an active module of the brettz9 Add-on
exports.main = function() {

    linkCm = cm.Item({
        label: _("copylinktextContext.label"),
        // _("copylinktextContext.accesskey"),
        context: cm.SelectorContext('a[href]'),
        contentScriptFile: data.url('link-context-menu.js'),
        data: stringify({
            localeObject: {
                emptyString: _("emptyString"),
                notPresent: _("notPresent")
            }
        }),
        onMessage: function (arr) {
            var alts = arr[1],
                copytext = alts ?
                    _("addAltToLinkText", arr[0], alts.join(_("altJoin"))) :
                    arr[0];
            return copyToClipboard(copytext);
        }
    });
    otherCm = cm.Item({
        label: _("copylinktextContext.label"),
        // _("copylinktextContext.accesskey"),
        context: cm.SelectorContext('input, select, button'), // , img
        contentScriptFile: data.url('other-context-menu.js'),
        data: stringify({
            localeObject: {
                joinOptsText: _("joinOptsText"),
                joinOpts: _("joinOpts")
            }
        }),
        onMessage: function (arr) {
            copyToClipboard(getCopyTextFromPrompt.apply(null, arr));
        }
    });

    simplePrefs.on('', setByPref);
    setByPref('accessFormControls');
    setByPref('accessPass');
    setByPref('showAltText');

};

}());