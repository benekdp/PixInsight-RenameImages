#feature-id    DP > RenameImages
#feature-info  A script to rename images based on filter types.<br/>\
   <br/>\
   Copyright (c) 2023 Benek
#feature-icon  RenameImages.png

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/SectionBar.jsh>
#include <pjsr/ButtonCodes.jsh>

#define VERSION "1.0"

function infoDialog() {
    this.__base__ = Dialog;
    this.__base__();
    this.infoLabel = new Label(this);
    this.infoLabel.text =
        "<p align='center'><b>RenameImages V1.0</b><br><br>" +
        "This script renames open images in PixInsight based on their filter indicators.<br>" +
        "It identifies the filter type in the image name and renames the image accordingly.<br><br>" +
        "If you appreciate my work and want to support me in creating more scripts, buy me a beer or coffee through a donation on PayPal:<br><br>" +
        "👉 <b>PayPal: dpbenek@gmail.com</b><br><br>" +
        "Remember, if you use my scripts, we are like family and friends, " +
        "so choose the \"send to family and friends\" option to avoid fees 😉<br><br>" +
        "Thanks for your support!<br><br>" +
        "Best regards</p>";
    this.infoLabel.useRichText = true;
    this.infoLabel.textAlignment = TextAlign_Center;
    this.okButton = new PushButton(this);
    this.okButton.text = "OK";
    this.okButton.onClick = function() {
        this.dialog.ok();
    };
    this.sizer = new VerticalSizer;
    this.sizer.margin = 10;
    this.sizer.spacing = 6;
    this.sizer.add(this.infoLabel);
    this.sizer.addSpacing(12);
    this.sizer.add(this.okButton);
    this.windowTitle = "Information - RenameImages";
    this.adjustToContents();
    this.setFixedWidth(1000);
    this.setFixedHeight(300);
}
infoDialog.prototype = new Dialog;

function sanitizeName(name) {
    return name.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9]/g, "");
}

function ChangeNamesDialog() {
    this.__base__ = Dialog;
    this.__base__();

    this.filters = ["LUMINANCE", "RED", "GREEN", "BLUE", "SULFUR", "HYDROGEN", "OXYGEN"];
    this.textBoxes = {};

    this.sizer = new VerticalSizer;
    this.sizer.margin = 16;
    this.sizer.spacing = 10;

    for (var i = 0; i < this.filters.length; ++i) {
        var filter = this.filters[i];
        var hSizer = new HorizontalSizer;

        var label = new Label(this);
        label.text = filter + ":";
        label.minWidth = 100;
        hSizer.add(label);

        this.textBoxes[filter] = new Edit(this);
        this.textBoxes[filter].minWidth = 150;
        this.textBoxes[filter].text = filterSettings[filter] || "";
        hSizer.add(this.textBoxes[filter]);

        this.sizer.add(hSizer);
    }

    this.changeButton = new PushButton(this);
    this.changeButton.text = "Change Names";
    this.changeButton.onClick = function() {
        this.dialog.ok();
    };

    this.cancelButton = new PushButton(this);
    this.cancelButton.text = "Cancel";
    this.cancelButton.onClick = function() {
        this.dialog.cancel();
    };

    var buttonSizer = new HorizontalSizer;
    buttonSizer.add(this.changeButton);
    buttonSizer.add(this.cancelButton);
    this.sizer.add(buttonSizer);

    this.windowTitle = "Change Image Names";
    this.adjustToContents();
}

ChangeNamesDialog.prototype = new Dialog;

function detectFilter(window) {
    var currentName = window.mainView.id.toLowerCase();
    
    var filterPatterns = {
        'LUMINANCE': [
            /filter_l[_-]/, /_l_/, /-l-/, /filter_l_/, /^l_/, /^lum_/, /luminance/,
            /^l\./, /lum\./, /^light/, /^l$/
        ],
        'RED': [
            /filter_r[_-]/, /_r_/, /-r-/, /filter_r_/, /^r_/, /^red_/, /^r\./, 
            /red\./, /^r$/
        ],
        'GREEN': [
            /filter_g[_-]/, /_g_/, /-g-/, /filter_g_/, /^g_/, /^green_/, /^g\./, 
            /green\./, /^g$/
        ],
        'BLUE': [
            /filter_b[_-]/, /_b_/, /-b-/, /filter_b_/, /^b_/, /^blue_/, /^b\./, 
            /blue\./, /^b$/
        ],
        'SULFUR': [
            /filter_s[_-]/, /_s_/, /-s-/, /filter_s_/, /^s_/, /^sii_/, /sulfur/,
            /^s\./, /sii\./, /^s$/, /^sii$/, /_sii_/, /-sii-/
        ],
        'HYDROGEN': [
            /filter_h[_-]/, /_h_/, /-h-/, /filter_h_/, /^h_/, /^ha_/, /hydrogen/,
            /^h\./, /ha\./, /^h$/, /^ha$/, /_ha_/, /-ha-/, /halpha/, /h-alpha/
        ],
        'OXYGEN': [
            /filter_o[_-]/, /_o_/, /-o-/, /filter_o_/, /^o_/, /^oiii_/, /oxygen/,
            /^o\./, /oiii\./, /^o$/, /^oiii$/, /_oiii_/, /-oiii-/
        ]
    };

    for (var filter in filterPatterns) {
        for (var i = 0; i < filterPatterns[filter].length; i++) {
            if (filterPatterns[filter][i].test(currentName)) {
                return filter;
            }
        }
    }

    return null;
}

function changeNames(dialog)
{
    var windows = ImageWindow.windows;
    for (var i = 0; i < windows.length; ++i)
    {
        var window = windows[i];
        var currentName = window.mainView.id;
        var detectedFilter = detectFilter(window);

        if (detectedFilter)
        {
            var newName = sanitizeName(dialog.textBoxes[detectedFilter].text);
            if (newName)
            {
                window.mainView.id = newName;
                Console.writeln("Changed name from '" + currentName + "' to '" + newName + "'");
            }
            else
            {
                Console.writeln("Didn't change name for '" + currentName + "' - empty text field");
            }
        }
        else
        {
            Console.writeln("Didn't change name for '" + currentName + "' - filter not recognized");
        }
    }
}

function main()
{
    Console.show();
    Console.writeln("Script started");

    try {
        var info = new infoDialog();
        info.execute();

        Console.writeln("Loaded settings:");
        for (var filter in filterSettings) {
            Console.writeln(filter + ": " + filterSettings[filter]);
        }

        var dialog = new ChangeNamesDialog();
        Console.writeln("Dialog created");
        if (dialog.execute())
        {
            Console.writeln("Dialog accepted");
            changeNames(dialog);
            Console.writeln("Names have been changed");
        }
        else
        {
            Console.writeln("Operation cancelled by user");
        }
    } catch (error) {
        Console.criticalln("Error in main: " + error.message);
    }

    Console.writeln("Script finished");
}

main();