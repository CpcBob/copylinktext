/*globals self */
(function () {
'use strict';

function getMultiple (sel) {
    var i, selectedContent = [], selectedValues = [];
    for (i = 0; i < sel.options.length; i++) {
        if (sel.options[i].selected) {
            selectedContent.push(sel.options[i].textContent);
            selectedValues.push(sel.options[i].value);
        }
    }
    return [selectedContent, selectedValues];
}

function mouseDown (el) {
    var i, opt, optProps, labelText,
        textContent, value,
        nodeName = el.nodeName.toLowerCase(),
        labels = document.getElementsByTagName('label');
    for (i = 0; i < labels.length; i++) {
        if (labels[i].hasAttribute('for') && labels[i].getAttribute('for') === el.id) {
            labelText = labels[i].textContent;
            break;
        }
    }

    switch(nodeName) {
        // Todo: input type hidden, optgroup?, get form and form control names?
        case 'select':
            if (el.multiple) {
                optProps = getMultiple(el);
                textContent = optProps[0].join(_("joinOptsText"));
                value = optProps[1].join(_("joinOpts"));
            }
            else {
                opt = el.options[el.selectedIndex]; // Use option instead
                textContent = opt.textContent; // Since we are getting for option, any label cannot be added here
                value = opt.value;
            }
            break;
        case 'button':
            textContent = el.textContent || labelText || '';
            value = el.value;
            break;
        case 'input': // Useful for type=password,
                                 // (checkbox, radio),
                                 // (button, submit, reset),
                                 // file, image
                                 // (not getting hidden)
            if (el.type !== 'image') {
                if (el.type === 'password' && !accessPass) {
                    return;
                }
                textContent = el.textContent || labelText || ''; // textContent doesn't seem to work for these types
                value = el.value; // Could shorten menu below to avoid this, since is always the same
                // value = el.name;
                break;
            }
            /* Fall-through for image*/
        case 'img': // Already accessible on "View image info"->Associated text, but we'll add it automatically to the clipboard
            // Not in use?
            textContent = el.alt; // Fix: Could also add any text content, label, etc.
            value = el.src; // Fix: could add el.value?
            break;
    }

    self.postMessage([value, textContent, labelText]);
}

// PAGE EVENTS
self.on('context', function (el) {
    /* Not needed?
    var nodeName = el && el.nodeName.toLowerCase();
    if (nodeName === 'input' && // WE DISALLOW PASSWORD FIELDS IF DISABLED OR TEXT SELECTED
        el.type === 'password' &&
        el.selectionStart !== el.selectionEnd) {
        return;
    }
    */

    // Find a way to give option to preventDefault and "e.stopPropagation();" in case there are other events
    //     attached here, but we're interfering enough as it is, so it's probably not necessary
    //     as long as we don't disturb more than necessary by stopping propagation
    // Make conditional if user wishes for automatic execution
    mouseDown(el);
});

self.on('click', function (el, data) {
    mouseDown(el);
});

}());