/**
 * jQuery CoreUISelect
 * Special thanks to Artem Terekhin, Yuriy Khabarov, Alexsey Shein
 *
 * @author      Gennadiy Ukhanov
 * @version     0.0.3
 */
(function ($) {

    var defaultOption = {
        appendToBody : false,
        jScrollPane  : null,
        onInit       : null,
        onFocus      : null,
        onBlur       : null,
        onOpen       : null,
        onClose      : null,
        onChange     : null,
        onDestroy    : null
    }

    var allSelects = [];

    $.browser.mobile = (/iphone|ipad|ipod|android/i.test(navigator.userAgent.toLowerCase()));
    $.browser.operamini = Object.prototype.toString.call(window.operamini) === "[object OperaMini]";

    /**
     * CoreUISelect - stylized standard select
     * @constructor
     */
    function CoreUISelect(__elem, __options, __templates) {

        this.domSelect = __elem;
        this.settings = __options || defaultOption;
        this.isSelectShow = false;
        this.isSelectFocus = false;
        this.isJScrollPane = this.isJScrollPane();

        // templates
        this.templates = __templates ||
        {
            select : {
                container : '<div class="b-core-ui-select"></div>',
                value : '<span class="b-core-ui-select__value"></span>',
                button : '<span class="b-core-ui-select__button"></span>'
            },
            dropdown : {
                container : '<div class="b-core-ui-select__dropdown"></div>',
                wrapper : '<div class="b-core-ui-select__dropdown__wrap"></div>',
                list : '<ul class="b-core-ui-select__dropdown__list"></ul>',
                optionLabel : '<li class="b-core-ui-select__dropdown__label"></li>',
                item : '<li class="b-core-ui-select__dropdown__item"></li>'
            }
        }

        this.init(this.settings);
    }

    CoreUISelect.prototype.init = function() {
        if($.browser.operamini) return this;
        this.buildUI();
        this.hideDomSelect();
        if(this.domSelect.is(':disabled')) {
            this.select.addClass('disabled');
            return this;
        }
        if(this.isJScrollPane) this.buildJScrollPane();
        this.bindUIEvents();
        this.settings.onInit && this.settings.onInit.apply(this, [this.domSelect, 'init']);

    }

    CoreUISelect.prototype.buildUI = function() {

        // Build select container
        this.select = $(this.templates.select.container)
            .insertBefore(this.domSelect);

        this.selectValue = $(this.templates.select.value)
            .appendTo(this.select);

        // TODO Add custom states for button
        this.selectButton = $(this.templates.select.button)
            .appendTo(this.select);

        // Build dropdown container
        this.dropdown = $(this.templates.dropdown.container);
        this.dropdownWrapper =  $(this.templates.dropdown.wrapper).appendTo(this.dropdown);

        this.settings.appendToBody ? this.dropdown.appendTo($('body')) : this.dropdown.insertBefore(this.domSelect);

        // Build dropdown
        this.dropdownList =  $(this.templates.dropdown.list).appendTo(this.dropdownWrapper);
        this.domSelect.find('option').each($.proxy(this, 'addItems'));


        // Build dropdown
        this.dropdownItem =  this.dropdown.find('.'+$(this.templates.dropdown.item).attr('class'));

        // Add classes for dropdown
        this.dropdownItem.filter(':first-child').addClass('first');
        this.dropdownItem.filter(':last-child').addClass('last');

        this.addOptionGroup();

        // Add placeholder value by selected option
        this.setSelectValue(this.getSelectedItem().text());
        this.updateDropdownPosition();

        // Set current item form option:selected
        this.currentItemOfDomSelect = this.currentItemOfDomSelect || this.domSelect.find('option:selected');

    }

    CoreUISelect.prototype.hideDomSelect = function() {

        this.domSelect.addClass('b-core-ui-select__select_state_hide');
        this.domSelect.css({
            'top' : this.select.position().top,
            'left' : this.select.position().left
        });
    }

    CoreUISelect.prototype.showDomSelect = function() {
        this.domSelect.css({
            'top' : 'auto',
            'left' : 'auto'
        })
        this.domSelect.removeClass('b-core-ui-select__select_state_hide') ;
    }

    CoreUISelect.prototype.bindUIEvents = function() {
        // Bind plugin elements
        this.domSelect.bind('focus', $.proxy(this, 'onFocus'));
        this.domSelect.bind('blur', $.proxy(this, 'onBlur'));
        this.domSelect.bind('change', $.proxy(this, 'onChange'));

        if( $.browser.mobile) this.domSelect.bind('change', $.proxy(this, 'changeDropdownData'));
        this.select.bind('click', $.proxy(this, 'onSelectClick'));
        this.dropdownItem.bind('click', $.proxy(this, 'onDropdownItemClick'));
    }

    CoreUISelect.prototype.getCurrentIndexOfItem = function(__item) {
        return this.domSelect.find('option').index($(this.domSelect).find('option:selected'));
    }

    CoreUISelect.prototype.scrollToCurrentDropdownItem = function(__item) {
        if(this.dropdownWrapper.data('jsp')) {
            this.dropdownWrapper.data('jsp').scrollToElement(__item);
            return this;
        }
        // Alternative scroll to element
        $(this.dropdownWrapper)
            .scrollTop($(this.dropdownWrapper)
            .scrollTop() + __item.position().top - $(this.dropdownWrapper).height()/2 + __item.height()/2);
    }

    CoreUISelect.prototype.buildJScrollPane = function() {
        this.dropdownWrapper.wrap($('<div class="j-scroll-pane"></div>'));
    }

    CoreUISelect.prototype.isJScrollPane = function() {
        if(this.settings.jScrollPane) {
            if($.fn.jScrollPane) return true;
            else throw new Error('jScrollPane no found');
        }
    }

    CoreUISelect.prototype.initJScrollPane = function () {
        this.dropdownWrapper.jScrollPane(this.settings.jScrollPane);
    }

    CoreUISelect.prototype.showDropdown = function() {
        this.domSelect.focus();
        this.settings.onOpen && this.settings.onOpen.apply(this, [this.domSelect, 'open']);
        if($.browser.mobile) return this;
        if(!this.isSelectShow) {
            this.isSelectShow = true;
            this.select.addClass('open');
            this.dropdown.addClass('show').removeClass('hide');
            if(this.isJScrollPane) this.initJScrollPane();
            this.scrollToCurrentDropdownItem(this.dropdownItem.eq(this.getCurrentIndexOfItem()));
            this.updateDropdownPosition();
        }
    }

    CoreUISelect.prototype.hideDropdown = function() {
        if(this.isSelectShow) {
            this.isSelectShow = false;
            this.select.removeClass('open');
            this.dropdown.removeClass('show').addClass('hide');
            this.settings.onClose && this.settings.onClose.apply(this, [this.domSelect, 'close']);
        }
        if(this.isSelectFocus) this.domSelect.focus();
    }

    CoreUISelect.prototype.hideAllDropdown = function() {
        for(var i in allSelects) {
            if(allSelects[i].hasOwnProperty(i)) {
                allSelects.dropdown.isSelectShow = false;
                allSelects.dropdown.domSelect.blur();
                allSelects.dropdown.addClass('hide').removeClass('show');
            }
        }
    }

    CoreUISelect.prototype.changeDropdownData = function(event) {
        if((this.isSelectShow || this.isSelectFocus)) {
            this.currentItemOfDomSelect = this.domSelect.find('option:selected');
            this.dropdownItem.removeClass("selected");
            this.dropdownItem.eq(this.getCurrentIndexOfItem()).addClass("selected");
            this.scrollToCurrentDropdownItem(this.dropdownItem.eq(this.getCurrentIndexOfItem()));
            this.setSelectValue(this.currentItemOfDomSelect.text());

        }
        if($.browser.mobile) this.settings.onChange && this.settings.onChange.apply(this, [this.domSelect, 'change']);
    }

    CoreUISelect.prototype.onDomSelectChange = function(_is) {
        this.domSelect.bind('change', $.proxy(this, 'onChange'));
        dispatchEvent(this.domSelect.get(0), 'change');
        if(!_is) this.settings.onChange && this.settings.onChange.apply(this, [this.domSelect, 'change']);
    }

    CoreUISelect.prototype.addListenerByServicesKey = function(event) {
        if(this.isSelectShow) {
            switch (event.which) {
                case 9:   // TAB
                case 13:  // ESQ
                case 27:  // ENTER
                    this.hideDropdown();
                    break;
            }
        }
    }

    CoreUISelect.prototype.onSelectClick = function() {
        if(!this.isSelectShow) this.showDropdown();
        else this.hideDropdown();
        return false;
    }

    CoreUISelect.prototype.onFocus = function () {
        this.isDocumentMouseDown = false;
        this.isSelectFocus = true;
        this.select.addClass('focus');
        this.settings.onFocus && this.settings.onFocus.apply(this, [this.domSelect, 'focus']);
    }

    CoreUISelect.prototype.onBlur = function() {
        if(!this.isDocumentMouseDown) {
            this.isSelectFocus = false;
            this.select.removeClass('focus');
            this.settings.onBlur && this.settings.onBlur.apply(this, [this.domSelect, 'blur']);
            //this.hideDropdown();
        }
    }

    CoreUISelect.prototype.onChange = function () {
        this.settings.onChange && this.settings.onChange.apply(this, [this.domSelect, 'change']);
    }

    CoreUISelect.prototype.onDropdownItemClick = function(event) {
        var item = $(event.currentTarget);
        if(!(item.hasClass('disabled') || item.hasClass('selected'))) {
            this.domSelect.unbind('change', $.proxy(this, 'onChange'));
            var index = this.dropdown.find('.'+$(this.templates.dropdown.item).attr('class')).index(item)
            this.dropdownItem.removeClass('selected');
            this.dropdownItem.eq(index).addClass('selected');
            this.domSelect.find('option').removeAttr('selected');
            this.domSelect.find('option').eq(index).attr('selected', true);
            this.setSelectValue(this.getSelectedItem().text());
            this.onDomSelectChange(true);

        }
        this.hideDropdown();
        return false;
    }

    CoreUISelect.prototype.onDocumentMouseDown = function(event) {
        this.isDocumentMouseDown = true;
        if($(event.target).closest(this.select).length == 0 && $(event.target).closest(this.dropdown).length== 0) {
            if($(event.target).closest('option').length==0) {  // Hack for Opera
                this.isDocumentMouseDown = false;
                this.hideDropdown();
            }
        }
        return false;
    }

    CoreUISelect.prototype.updateDropdownPosition = function() {
        if(this.isSelectShow) {
            if(this.settings.appendToBody) {
                this.dropdown.css({
                    'position' : 'absolute',
                    'top' : this.select.offset().top+this.select.outerHeight(true),
                    'left' : this.select.offset().left,
                    'z-index' : '9999'
                });
            } else {
                this.dropdown.css({
                    'position' : 'absolute',
                    'top' : this.select.position().top+this.select.outerHeight(true),
                    'left' : this.select.position().left,
                    'z-index' : '9999'
                });
            }

            var marginDifferenceBySelect = this.select.outerWidth() - this.select.width();
            var marginDifferenceByDropdown = this.dropdown.outerWidth() - this.dropdown.width();

            this.dropdown.width(this.select.outerWidth(true));

            if(this.dropdown.width() == this.select.outerWidth()) {
                this.dropdown.width((this.select.width()+marginDifferenceBySelect)-marginDifferenceByDropdown);
            }

            if(this.isJScrollPane) this.initJScrollPane();
        }
    }

    CoreUISelect.prototype.setSelectValue = function(_text) {
        this.selectValue.text(_text);
    }

    CoreUISelect.prototype.isOptionGroup = function() {
        return this.domSelect.find('optgroup').length>0;
    }

    CoreUISelect.prototype.addOptionGroup = function() {
        var optionGroup = this.domSelect.find('optgroup');
        for(var i=0; i<optionGroup.length; i++) {
            var index = this.domSelect.find("option").index($(optionGroup[i]).find('option:first-child'))
            $(this.templates.dropdown.optionLabel)
                .text($(optionGroup[i]).attr('label'))
                .insertBefore(this.dropdownItem.eq(index));
        }
    }

    CoreUISelect.prototype.addItems = function(index, el) {
        var el = $(el);
        var item = $(this.templates.dropdown.item).text(el.text());
        if(el.attr("disabled")) item.addClass('disabled');
        if(el.attr("selected")) {
            this.domSelect.find('option').removeAttr('selected');
            item.addClass('selected');
            el.attr('selected', 'selected');
        }
        item.appendTo(this.dropdownList);
    }

    CoreUISelect.prototype.getSelectedItem = function() {
        return this.dropdown.find('.selected').eq(0);
    }

    CoreUISelect.prototype.update = function() {
        this.destroy();
        this.init();
    }

    CoreUISelect.prototype.destroy = function() {
        // Unbind plugin elements
        this.domSelect.unbind('focus', $.proxy(this, 'onFocus'));
        this.domSelect.unbind('blur', $.proxy(this, 'onBlur'));
        this.domSelect.unbind('change', $.proxy(this, 'onChange'));
        this.select.unbind('click', $.proxy(this, 'onSelectClick'));
        this.dropdownItem.unbind('click', $.proxy(this, 'onDropdownItemClick'));
        // Remove select container
        this.select.remove();
        this.dropdown.remove();
        this.showDomSelect();
        this.settings.onDestroy && this.settings.onDestroy.apply(this, [this.domSelect, 'destroy']);
    }


    $.fn.coreUISelect = function(__options, __templates) {
        return this.each(function () {
            var select = $(this).data('coreUISelect');
            if(__options == 'destroy' && !select) return;
            if(select){
                __options = (typeof __options == "string" && select[__options]) ? __options : 'update';
                select[__options].apply(select);
                if(__options == 'destroy') {
                    $(this).removeData('coreUISelect');
                    for(var i=0; i<allSelects.length; i++) {
                        if(allSelects[i] == select) {
                            allSelects.splice(i, 1);
                            break;
                        }
                    }
                }
            } else {
                select = new CoreUISelect($(this), __options, __templates);
                allSelects.push(select);
                $(this).data('coreUISelect', select);
            }

        });
    };

    function dispatchEvent(obj, evt, doc) {
        var doc = doc || document;
        if(obj!==undefined || obj!==null) {
            if (doc.createEvent) {
                var evObj = doc.createEvent('MouseEvents');
                evObj.initEvent(evt, true, false);
                obj.dispatchEvent(evObj);
            } else if (doc.createEventObject) {
                var evObj = doc.createEventObject();
                obj.fireEvent('on' + evt, evObj);
            }
        }
    }

    $(document).bind('mousedown', function(event){
        for(var i=0; i<allSelects.length; i++){
            allSelects[i].onDocumentMouseDown(event);
        }
    });

    $(document).bind('keyup', function(event){
        for(var i=0; i<allSelects.length; i++){
            if($.browser.safari || $.browser.msie || $.browser.opera) allSelects[i].changeDropdownData(event); // Hack for Safari
            allSelects[i].addListenerByServicesKey(event);
        }
    });

    $(document).bind($.browser.safari ? 'keydown' : 'keypress', function(event){
        for(var i=0; i<allSelects.length; i++){
            allSelects[i].changeDropdownData(event);
        }
    });

    $(window).bind('resize', function(event){
        for(var i=0; i<allSelects.length; i++){
            allSelects[i].updateDropdownPosition(event);
        }
    });



})(jQuery);;
/* Copyright (c) 2010 Brandon Aaron (http://brandonaaron.net)
 * Dual licensed under the MIT (MIT_LICENSE.txt)
 * and GPL Version 2 (GPL_LICENSE.txt) licenses.
 *
 * Version: 1.1.1
 * Requires jQuery 1.3+
 * Docs: http://docs.jquery.com/Plugins/livequery
 */
(function(a){a.extend(a.fn,{livequery:function(e,d,c){var b=this,f;if(a.isFunction(e)){c=d,d=e,e=undefined}a.each(a.livequery.queries,function(g,h){if(b.selector==h.selector&&b.context==h.context&&e==h.type&&(!d||d.$lqguid==h.fn.$lqguid)&&(!c||c.$lqguid==h.fn2.$lqguid)){return(f=h)&&false}});f=f||new a.livequery(this.selector,this.context,e,d,c);f.stopped=false;f.run();return this},expire:function(e,d,c){var b=this;if(a.isFunction(e)){c=d,d=e,e=undefined}a.each(a.livequery.queries,function(f,g){if(b.selector==g.selector&&b.context==g.context&&(!e||e==g.type)&&(!d||d.$lqguid==g.fn.$lqguid)&&(!c||c.$lqguid==g.fn2.$lqguid)&&!this.stopped){a.livequery.stop(g.id)}});return this}});a.livequery=function(b,d,f,e,c){this.selector=b;this.context=d;this.type=f;this.fn=e;this.fn2=c;this.elements=[];this.stopped=false;this.id=a.livequery.queries.push(this)-1;e.$lqguid=e.$lqguid||a.livequery.guid++;if(c){c.$lqguid=c.$lqguid||a.livequery.guid++}return this};a.livequery.prototype={stop:function(){var b=this;if(this.type){this.elements.unbind(this.type,this.fn)}else{if(this.fn2){this.elements.each(function(c,d){b.fn2.apply(d)})}}this.elements=[];this.stopped=true},run:function(){if(this.stopped){return}var d=this;var e=this.elements,c=a(this.selector,this.context),b=c.not(e);this.elements=c;if(this.type){b.bind(this.type,this.fn);if(e.length>0){a.each(e,function(f,g){if(a.inArray(g,c)<0){a.event.remove(g,d.type,d.fn)}})}}else{b.each(function(){d.fn.apply(this)});if(this.fn2&&e.length>0){a.each(e,function(f,g){if(a.inArray(g,c)<0){d.fn2.apply(g)}})}}}};a.extend(a.livequery,{guid:0,queries:[],queue:[],running:false,timeout:null,checkQueue:function(){if(a.livequery.running&&a.livequery.queue.length){var b=a.livequery.queue.length;while(b--){a.livequery.queries[a.livequery.queue.shift()].run()}}},pause:function(){a.livequery.running=false},play:function(){a.livequery.running=true;a.livequery.run()},registerPlugin:function(){a.each(arguments,function(c,d){if(!a.fn[d]){return}var b=a.fn[d];a.fn[d]=function(){var e=b.apply(this,arguments);a.livequery.run();return e}})},run:function(b){if(b!=undefined){if(a.inArray(b,a.livequery.queue)<0){a.livequery.queue.push(b)}}else{a.each(a.livequery.queries,function(c){if(a.inArray(c,a.livequery.queue)<0){a.livequery.queue.push(c)}})}if(a.livequery.timeout){clearTimeout(a.livequery.timeout)}a.livequery.timeout=setTimeout(a.livequery.checkQueue,20)},stop:function(b){if(b!=undefined){a.livequery.queries[b].stop()}else{a.each(a.livequery.queries,function(c){a.livequery.queries[c].stop()})}}});a.livequery.registerPlugin("append","prepend","after","before","wrap","attr","removeAttr","addClass","removeClass","toggleClass","empty","remove","html");a(function(){a.livequery.play()})})(jQuery);;
/*
 HTML5 Shiv v3.7.0 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
*/
(function(l,f){function m(){var a=e.elements;return"string"==typeof a?a.split(" "):a}function i(a){var b=n[a[o]];b||(b={},h++,a[o]=h,n[h]=b);return b}function p(a,b,c){b||(b=f);if(g)return b.createElement(a);c||(c=i(b));b=c.cache[a]?c.cache[a].cloneNode():r.test(a)?(c.cache[a]=c.createElem(a)).cloneNode():c.createElem(a);return b.canHaveChildren&&!s.test(a)?c.frag.appendChild(b):b}function t(a,b){if(!b.cache)b.cache={},b.createElem=a.createElement,b.createFrag=a.createDocumentFragment,b.frag=b.createFrag();
a.createElement=function(c){return!e.shivMethods?b.createElem(c):p(c,a,b)};a.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+m().join().replace(/[\w\-]+/g,function(a){b.createElem(a);b.frag.createElement(a);return'c("'+a+'")'})+");return n}")(e,b.frag)}function q(a){a||(a=f);var b=i(a);if(e.shivCSS&&!j&&!b.hasCSS){var c,d=a;c=d.createElement("p");d=d.getElementsByTagName("head")[0]||d.documentElement;c.innerHTML="x<style>article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}</style>";
c=d.insertBefore(c.lastChild,d.firstChild);b.hasCSS=!!c}g||t(a,b);return a}var k=l.html5||{},s=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,r=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,j,o="_html5shiv",h=0,n={},g;(function(){try{var a=f.createElement("a");a.innerHTML="<xyz></xyz>";j="hidden"in a;var b;if(!(b=1==a.childNodes.length)){f.createElement("a");var c=f.createDocumentFragment();b="undefined"==typeof c.cloneNode||
"undefined"==typeof c.createDocumentFragment||"undefined"==typeof c.createElement}g=b}catch(d){g=j=!0}})();var e={elements:k.elements||"abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video",version:"3.7.0",shivCSS:!1!==k.shivCSS,supportsUnknownElements:g,shivMethods:!1!==k.shivMethods,type:"default",shivDocument:q,createElement:p,createDocumentFragment:function(a,b){a||(a=f);
if(g)return a.createDocumentFragment();for(var b=b||i(a),c=b.frag.cloneNode(),d=0,e=m(),h=e.length;d<h;d++)c.createElement(e[d]);return c}};l.html5=e;q(f)})(this,document);
;
//http://www.featureblend.com/license.txt
var FlashDetect=new function(){var self=this;self.installed=false;self.raw="";self.major=-1;self.minor=-1;self.revision=-1;self.revisionStr="";var activeXDetectRules=[{"name":"ShockwaveFlash.ShockwaveFlash.7","version":function(obj){return getActiveXVersion(obj);}},{"name":"ShockwaveFlash.ShockwaveFlash.6","version":function(obj){var version="6,0,21";try{obj.AllowScriptAccess="always";version=getActiveXVersion(obj);}catch(err){}
return version;}},{"name":"ShockwaveFlash.ShockwaveFlash","version":function(obj){return getActiveXVersion(obj);}}];var getActiveXVersion=function(activeXObj){var version=-1;try{version=activeXObj.GetVariable("$version");}catch(err){}
return version;};var getActiveXObject=function(name){var obj=-1;try{obj=new ActiveXObject(name);}catch(err){obj={activeXError:true};}
return obj;};var parseActiveXVersion=function(str){var versionArray=str.split(",");return{"raw":str,"major":parseInt(versionArray[0].split(" ")[1],10),"minor":parseInt(versionArray[1],10),"revision":parseInt(versionArray[2],10),"revisionStr":versionArray[2]};};var parseStandardVersion=function(str){var descParts=str.split(/ +/);var majorMinor=descParts[2].split(/\./);var revisionStr=descParts[3];return{"raw":str,"major":parseInt(majorMinor[0],10),"minor":parseInt(majorMinor[1],10),"revisionStr":revisionStr,"revision":parseRevisionStrToInt(revisionStr)};};var parseRevisionStrToInt=function(str){return parseInt(str.replace(/[a-zA-Z]/g,""),10)||self.revision;};self.majorAtLeast=function(version){return self.major>=version;};self.minorAtLeast=function(version){return self.minor>=version;};self.revisionAtLeast=function(version){return self.revision>=version;};self.versionAtLeast=function(major){var properties=[self.major,self.minor,self.revision];var len=Math.min(properties.length,arguments.length);for(i=0;i<len;i++){if(properties[i]>=arguments[i]){if(i+1<len&&properties[i]==arguments[i]){continue;}else{return true;}}else{return false;}}};self.FlashDetect=function(){if(navigator.plugins&&navigator.plugins.length>0){var type='application/x-shockwave-flash';var mimeTypes=navigator.mimeTypes;if(mimeTypes&&mimeTypes[type]&&mimeTypes[type].enabledPlugin&&mimeTypes[type].enabledPlugin.description){var version=mimeTypes[type].enabledPlugin.description;var versionObj=parseStandardVersion(version);self.raw=versionObj.raw;self.major=versionObj.major;self.minor=versionObj.minor;self.revisionStr=versionObj.revisionStr;self.revision=versionObj.revision;self.installed=true;}}else if(navigator.appVersion.indexOf("Mac")==-1&&window.execScript){var version=-1;for(var i=0;i<activeXDetectRules.length&&version==-1;i++){var obj=getActiveXObject(activeXDetectRules[i].name);if(!obj.activeXError){self.installed=true;version=activeXDetectRules[i].version(obj);if(version!=-1){var versionObj=parseActiveXVersion(version);self.raw=versionObj.raw;self.major=versionObj.major;self.minor=versionObj.minor;self.revision=versionObj.revision;self.revisionStr=versionObj.revisionStr;}}}}}();};FlashDetect.JS_RELEASE="1.0.4";;
function windowScroll(div) {
  // Set a default for header, this shouldn't be null.
  var headerHeight = 0;
  if (jQuery('#pro-sub-header-links-wrapper').css('display') != 'none') {
    headerHeight += jQuery('#pro-sub-header-links-wrapper').outerHeight();
  }
  // Allow for margin because there is right now some space above.
  if (jQuery('#header-top-wrapper').css('display') != 'none') {
    headerHeight += jQuery('#header-top-wrapper').outerHeight(true);
  }
  // Don't allow for margin because the margin is how this is position. :-(
  if (jQuery('#header-wrapper').css('display') != 'none') {
    // outerHeight(TRUE) - parameter toggles allow for margin or not.
    headerHeight += jQuery('#header-wrapper').outerHeight();
  }
  var top = div.offset().top - headerHeight;
  jQuery('html,body').animate({scrollTop: top},'fast');
  // Return false so that we don't actually follow the real link.
}

jQuery(document).ready(function ($) {
  // If this is a page where there is an anchor.
  if (document.location.hash && $(document.location.hash).length) {
    // Scroll automatically.
    windowScroll($(document.location.hash));
  }
  // All anchor links with this class will scroll and allow for the height
  // of the headers.
  $('.anchor-links').click(function() {
    // Get the anchor of what we're aming for.
    // Change the href="" to the id. 
    // We could use name="" but apparently that is deprecated in html5.
    var anchor = $('#' + $(this).attr('href').replace('#', ''));
    windowScroll(anchor);
    return false;
  });
	if ( jQuery("#block-user-login #edit-name").length>0 ) {
		jQuery("#block-user-login #edit-name").val("Username");
		jQuery("#block-user-login #edit-name").click(function () {
			jQuery(this).css("color","#333");
			jQuery(this).val("");
		})
	}

	if ( jQuery("#block-user-login #edit-pass").length>0 ) {
		jQuery("#block-user-login #edit-pass").val("Password");
		jQuery("#block-user-login #edit-pass").click(function () {
			jQuery(this).css("color","#333");
			jQuery(this).val("");
		})
	}

	if ( jQuery("#search-block-form .form-text").length>0 ) {
		/*jQuery("#search-block-form .form-text").val("Search this site..");*/
		jQuery("#search-block-form .form-text").click(function ()
		{
			jQuery(this).css("color","#333");
			jQuery(this).val("");
		})
	}

	if ( jQuery("#search-form .form-text").length>0 ) {
		jQuery("#search-form .form-text").focus();
	}

	if (jQuery("#main-menu-title").length>0) {
		jQuery("#main-menu-title").click(function () {
			jQuery("nav").toggleClass("expanded");
		})
	}

	if (jQuery("#block-system-main-menu h2").length>0) {
		jQuery("#block-system-main-menu h2").click(function () {
			jQuery("nav").toggleClass("expanded");
		})
	}
	if (jQuery("#block-system-main-menu h2").length>0) {
		jQuery("#block-system-main-menu h2").click(function () {
			jQuery("nav").toggleClass("expanded");
		})
	}

});

/*
//add classes to menus for easy theming
jQuery(document).ready(function () {
		jQuery('[id^="block-menu_block-"] ul').addClass('level-1');
		jQuery('[id^="block-menu_block-"] ul li ').addClass('level-1');
		jQuery('[id^="block-menu_block-"] ul li a').addClass('level-1');
		jQuery('[id^="block-menu_block-"] ul li ul').removeClass('level-1').addClass('level-2');
		jQuery('[id^="block-menu_block-"] ul li ul li ').removeClass('level-1').addClass('level-2');
		jQuery('[id^="block-menu_block-"] ul li ul li a').removeClass('level-1').addClass('level-2');
		jQuery('[id^="block-menu_block-"] ul li ul li ul').removeClass('level-1 level-2').addClass('level-3');
		jQuery('[id^="block-menu_block-"] ul li ul li ul li').removeClass('level-1 level-2').addClass('level-3');
		jQuery('[id^="block-menu_block-"] ul li ul li ul li a').removeClass('level-1 level-2').addClass('level-3');
});
*/
/*
//if main menu in header has no active trail (front page) set header height to 90px and add class so it can expand on hover
jQuery(document).ready(function () {
	if( !jQuery('#block-menu_block-2 ul li').hasClass('active-trail') ){
		jQuery('#header').css('height' , '90px').addClass('no-active-trail');
		jQuery('#pro-sub-header-links-wrapper').addClass('no-active-trail');
	}
	//expand header on hover on pages w/ no active-trail
	jQuery('#header.no-active-trail #block-menu_block-2 ul li').mouseover(function(){
	        jQuery('#header').css('height' , '121px');
	    }).mouseout(function(){
	        jQuery('#header').css('height' , '90px');
	    });
});
*/
jQuery(document).ready(function () {
	if( !jQuery('#block-menu_block-2 ul li').hasClass('active-trail') ){
		jQuery('body').addClass('no-active-trail');
	}
});	

//wrap menu items for proper right borders
/*
jQuery(document).ready(function () {
	jQuery('#block-menu_block-2 ul.menu:first-child>li').each(function(i){
		jQuery(this).wrap('<div class="js-added right-border"></div>')
	});
});
*/
/*
jQuery(document).ready(function () {
	//jQuery('#block-menu_block-2 ul.level-2').wrap('<div class="js-added menu-wrapper level-2"></div>');
});
*/

// placeholder text for input
jQuery(document).ready(function () {

    jQuery.support.placeholder = (function(){
	    var i = document.createElement('input');
	    return 'placeholder' in i;
	})();

    if (!jQuery.support.placeholder) {
      jQuery(".your-email").val('Your Email');
        jQuery(".your-email").focus(function () {
            jQuery(this).val('');
        });
    } else {
	  jQuery(".your-email").val('');
      jQuery(".your-email").attr('Placeholder' , 'Your Email');
    }
});


// homepage adopt a pet block toggle
jQuery(document).ready(function () {
	//store locator block visibility toggle
	jQuery(".toggle-visibility-wrapper").click(function () {
		 jQuery(".block-pci-store-locator").toggleClass("hidden")
	   jQuery(".toggle-visibility").toggleClass("hidden").text("Hide");
		 jQuery(".toggle-visibility.hidden").text("Expand");
	});

	jQuery(".front-adopt-pet-toggle").click(function () {
	   jQuery("#boxes-box-front_adopt_pet #front-adopt-pet-expand").show();
	   jQuery("#boxes-box-front_adopt_pet #front-adopt-pet").hide();
	});

 	jQuery(".front-adopt-pet-toggle-expand").click(function () {
		jQuery("#boxes-box-front_adopt_pet #front-adopt-pet").show();
	   jQuery("#boxes-box-front_adopt_pet #front-adopt-pet-expand").hide();
	});
});

//load jquery after ajax loads, ie views load more

// use core-ui-select lib to theme select inputs
jQuery(document).ready(function ($) {
	//detect android devices
	var agent = navigator.userAgent.toLowerCase();
	var isAndroid = agent.indexOf("android") > -1;
	//only add core ui select to non android devices
	if (!isAndroid) {
		jQuery('select').coreUISelect();
	}
	else {
		jQuery('select').addClass("android");
	}
	
	jQuery(document).ajaxComplete(function($) {
	//add core ui select to non android devices after ajax complete
	if (!isAndroid) {
		jQuery('select').coreUISelect();
	}
	else {
		jQuery('select').addClass("android");
	}

	//load sharethis code after ajax loads more views rows
	stButtons.locateElements();
	});
	
});

/*  remove nodequeue at top of stories listing view when filters are changed
 *  also for views on adopt-a-pet page
 */

jQuery(document).ready(function() {
	
		//hide the views rows and show more button until show more button or filters are clicked
		jQuery('.view-stories-listing .views-row').hide();
		jQuery('.view-stories-listing.view-user-stories-listing .views-row').show(); // except for on the user stories listing page -- adoption announcements
		jQuery('.view-stories-listing .pager-load-more').hide();
	
		//when dummy button is clicked hide the nodequeue and show the views rows that were hidden initially
		jQuery('.view-stories-listing-nodequeue .dummy-button').click(function(e){
			e.preventDefault();
			jQuery('.view-stories-listing .views-row').show("fast");
			jQuery('.view-stories-listing .pager-load-more').show();
			jQuery('.view-stories-listing-nodequeue').hide();
		});

		addClassToRows();
		
		//hide the nodequeue when filter is changed
		/*var select1 = jQuery('.view-stories-listing #edit-field-state-value');
		var select2 = jQuery('.view-stories-listing #edit-field-grant-partnership-type-value');
		var radio1 = jQuery('.view-stories-listing #edit-field-story-type-value-dog-adoption-story');
		var radio2 = jQuery('.view-stories-listing #edit-field-story-type-value-cat-adoption-story');
		var content_type_filter = jQuery('.view-stories-listing #edit-type-1-wrapper input');
		var pet_type_filter = jQuery('.view-stories-listing #edit-combine input');*/
		
		jQuery('.view-stories-listing input').click(function() {
			jQuery('.view-stories-listing-nodequeue').hide();
		});	
});

function addClassToRows(){
	jQuery('.view-stories-listing-nodequeue .views-row').has('.views-field-field-media-files .file-image').addClass("has-image js-added");
	jQuery('.view-stories-listing-nodequeue .views-row').has('.views-field-field-media-files .file-video').addClass("has-video js-added");
}

//cycle through images in a node w/ multiple images in the same field
jQuery(document).ready(function() {
	//throws error on other pages so just load on this page
	if (jQuery('body').hasClass('save-pets-now') && jQuery('body').hasClass('top-level')) {
		//wrap images in a container for cycling
		jQuery('.view-featured-story-nodequeue-on-save-pets-now img').wrapAll('<div id="jquery-cycle-slideshow" />');
		//add cycle 
		jQuery('#jquery-cycle-slideshow').cycle({
			fx: 'scrollRight'
		});
		//if more than 1 image add prev next buttons
		var count = jQuery('#jquery-cycle-slideshow img').length;
		if (count > 1) {
			jQuery('#jquery-cycle-slideshow').prepend('<div id="cycle-next"></div>');
			jQuery('#jquery-cycle-slideshow').prepend('<div id="cycle-prev"></div>');
			jQuery('#cycle-next').click(function() {
				jQuery('#jquery-cycle-slideshow').cycle('next');
			});
			jQuery('#cycle-prev').click(function() {
				jQuery('#jquery-cycle-slideshow').cycle('prev');
			});
		}
	}
});


// add a dummy share button to slideshow footer and click the real button when dummy is clicked, so it shares the node
jQuery(document).ready(function() {
	jQuery('.view-adopt-a-pet-slideshow .view-footer .dummy-share').click(function(){
		jQuery('.view-adopt-a-pet-slideshow .views_slideshow_slide:visible .st_sharethis_large').trigger('click');
	});
});

//reset button for stories listing pages
jQuery(document).ready(function() {
	
	jQuery("body").delegate('.stories-reset-scroll-to' , "click" , function() {
		location.reload();
	});

});

// Auto-submit iframed pet search form.
jQuery(document).ready(function () {
  var parseQueryString = function( queryString ) {
      var params = {}, queries, temp, i, l;
      queries = queryString.split("&");
      for ( i = 0, l = queries.length; i < l; i++ ) {
          temp = queries[i].split('=');
          params[temp[0]] = temp[1];
      }
      return params;
  };

  jQuery('iframe#petsearch').each(function() {
    var iframe = jQuery(this);
    var iframequery  = parseQueryString(iframe.attr('src').replace(/&amp;/, "&").split('?')[1]);
    var docquery     = parseQueryString(document.location.search.toString().replace(/\?/, ''));
    var submitted    = false;
    for (var k in iframequery) {
      if (docquery[k] != undefined) {
        submitted = true;
        iframequery[k] = docquery[k];
      }
    }
    if (submitted) {
      var newquery = jQuery.param(iframequery);
      var newsrc   = iframe.attr('src').split('?')[0] + '?' + newquery;
      iframe.attr('src',newsrc);
    }
  });
});





/* disable ckeditor per textarea code
(function (jQuery) {
Drupal.myWysiwygControl = {
  attach : attachWysiwyg,
  detach : detachWysiwyg
}

function detachWysiwyg(field) {
  var wysiwygField = null;
  if (wysiwygField = getWysiwygData(field)) {
    // Detach editor.
    Drupal.wysiwygDetach(wysiwygField.context, wysiwygField.params);
  }
  // Hide toggle link if visible.
   jQuery('#wysiwyg-toggle-' + field).hide();
  // Hide the whole field and format selector.  OPTIONAL: You might not need this.
   jQuery('#' + field).parents('.text-format-wrapper').hide();
}

function attachWysiwyg(field) {
  var wysiwygField = null;
  if ((wysiwygField = getWysiwygData(field))) {
    //(Re-)attach editor.
    Drupal.wysiwygAttach(wysiwygField.context, wysiwygField.params);
  }
  // Unhide the toggle link. (Also done by Drupal.wysiwygAttach, but it might not have run.)
   jQuery('#wysiwyg-toggle-' + field).show();
  // Unhide the whole field and format selector. OPTIONAL: You might not need this.
   jQuery('#' + field).parents('.text-format-wrapper').show();
}

function getWysiwygData(field) {
  if (!Drupal.wysiwyg) {
    return false;
  }
  // Get any instance active for the field.
  var instance = Drupal.wysiwyg.instances[field];
  // Exit if no editor or it is disabled.
  // instance.trigger may be undefined when instance.editor == 'none'.
  if (!instance || instance.editor == 'none') {
    return false;
  }
  // Get per-format parameters for the field.
  var params = Drupal.settings.wysiwyg.triggers[instance.trigger];
  // Set the context to a parent element that wraps as much as possible of the
  // elements related to the field and format without overlapping other fields.
  var context =  jQuery('#' + field).parents('.text-format-wrapper');
  return {
    'instance' : instance,
    'params' : params[instance.format],
    'context' : context
  };
}

})(jQuery);


alert("test");
  Drupal.myWysiwygControl.detach('edit-field-embed-code');





*/

/**
 * return true if viewport width is mobile size
 */
function is_mobile() {
  var viewportWidth = jQuery(window).width();
  if (viewportWidth > 600) {
    return false;
  }
  else {
    return true;
  }
}

jQuery(document).ready(function () {

  if (is_mobile()) {
    // Add mobile menu open/close buttons.
    //jQuery('#header').append('<div id="mobile-menu-icon"><a href="#" class="menu-icon-open"></a></div>');
  }

  jQuery('.menu-icon-open').toggle(
    function() {
      jQuery('#block-menu_block-2.main-menu-header , .pro-content #block-menu_block-2.block-menu-block').css('display', 'block');
      jQuery(this).toggleClass('menu-on');
      return false;
    },
    function() {
      jQuery('#block-menu_block-2.main-menu-header , .pro-content #block-menu_block-2.block-menu-block').css('display', 'none');
      jQuery(this).toggleClass('menu-on');
      return false;
    }
  );

  jQuery('#block-menu_block-2').mouseenter(function() {
    //jQuery(this).css('display', 'block');
  });
  
  jQuery('#block-menu_block-2').mouseleave(function() {
    //jQuery('.menu-icon-open').click();
  });
});

// hide publication dte field on events.
jQuery(document).ready(function () {
  if (jQuery(".field-name-field-article-type:contains('Event')")) {
   jQuery(".node-type-article .views-field-field-publication-date").hide();
  }
});

//scroll up after click "show more stories" button on adopt-a-pet
jQuery(document).ready(function () {
	
	if (jQuery(window).width() > 600) {
		if (jQuery('body').hasClass('top-level') && jQuery('body').hasClass('adopt-a-pet')) {
			//code
		
		var headerOffset = 330;
    var viewPosObj = jQuery('.top-level.adopt-a-pet .view-stories-listing-nodequeue');
    if (viewPosObj.length) {
      var viewPos = viewPosObj.offset().top;
      var counter = viewPos - headerOffset;
      var viewsRowHeight = 580;
      
      jQuery('.top-level.adopt-a-pet a.dummy-button').click(function(){
            jQuery('html, body').animate({scrollTop:counter}, 1000);
      counter += viewsRowHeight;
      });
      
      jQuery('.top-level.adopt-a-pet .pager-load-more a').click(function(){
            jQuery('html, body').animate({scrollTop:counter}, 1000);
      counter += viewsRowHeight;
      });
      
      jQuery(document).ajaxComplete(function() {
        jQuery('.top-level.adopt-a-pet .pager-load-more a').click(function(){
              jQuery('html, body').animate({scrollTop:counter}, 1000);
        counter += viewsRowHeight;
        });
      });
    }
		}
	}
});

//if sidebar is longer than content set content height to sidebar height
jQuery(document).ready(function () {
	
	jQuery(window).load(function() {
    var sidebarHeight = jQuery('#sidebar-second').height();
	  var contentAreaHeight = jQuery('#content-area').height();
	  if (sidebarHeight > contentAreaHeight) {
		  jQuery('#content-area').css('height' , sidebarHeight);
		}
  });
	
});


/**
 *  show/hide the sub menu
 *  set a delay, if the mouse leaves the sub menu then hide after x milliseconds
 *  if the mouse reenters the menu clear the timer and hide the sub menu that was on the timer
 */

var deviceAgent = navigator.userAgent.toLowerCase();

var isTouchDevice = (deviceAgent.match(/(iphone|ipod|ipad)/) ||
deviceAgent.match(/(android)/)  || 
deviceAgent.match(/(iemobile)/) || 
deviceAgent.match(/iphone/i) || 
deviceAgent.match(/ipad/i) || 
deviceAgent.match(/ipod/i) || 
deviceAgent.match(/blackberry/i) || 
deviceAgent.match(/bada/i));

jQuery(document).ready(function () {
	
	if (!isTouchDevice) {
		
		var subNavTimer = null;
		var mainNavTimer = null;
		//number of milliseconds for timer to delay
		var subNavTimerDelay = 2000;
		var mainNavTimerDelay = 500;
		//var fadeInTime = 200;
		//var fadeOutTime = 200;
		var menu_level_2 = jQuery('#block-menu_block-2 ul.menu li ul.menu');
		
		jQuery('#block-menu_block-2 ul li.level-1').mouseenter(function() {
			//if mouse enters the element before timer runs out clear the timer so element stays on screen
			jQuery(this).removeClass('not-hovered');
			jQuery(this).addClass('hovered');
			//('ul' , this).removeClass('not-hovered');
			//jQuery('ul' , this).addClass('hovered');
			
			if (subNavTimer !== null) {
				//clear timer
				clearTimeout(subNavTimer);
				subNavTimer = null;
				//hide the ul that would have been hidden after timer finished
				jQuery(menu_level_2).hide();
				jQuery(menu_level_2).css('z-index' , '9');
			}
			//show ul
			jQuery('#block-menu_block-2 ul li.level-1.hovered ul').css('z-index' , '999');
			jQuery('#block-menu_block-2 ul li.level-1.hovered ul').css('display' , 'inline-block');
			
			
		});
		
		jQuery('#block-menu_block-2 ul li.level-1').mouseleave(function() {
			
			jQuery(this).removeClass('hovered');
			jQuery(this).addClass('not-hovered');
			//jQuery('ul' , this).removeClass('hovered');
			//jQuery('ul' , this).addClass('not-hovered');
			
			subNavTimer = setTimeout(function() {
			  jQuery('#block-menu_block-2 ul li.level-1.not-hovered ul').css('z-index' , '9');
		    jQuery('#block-menu_block-2 ul li.level-1.not-hovered ul').hide();
			}, subNavTimerDelay);
			
		});
		/*
		//hide login block when mouse leaves block
		jQuery('#block-menu_block-2 ul li.level-1 ul').mouseleave(function() {
			//if mouse leaves ul start timer to hide it
			subNavTimer = setTimeout(function() {
				//hide ul after timerDelay
				jQuery(menu_level_2).css('z-index' , '9');
				jQuery(menu_level_2).hide();
			}, subNavTimerDelay);
		});
		*/
	}
});

jQuery(document).ready(function () {
	//hide row weights by default on user story edit page
	if (jQuery('body').hasClass('node-type-user-story-edit')) {
		Drupal.tableDrag.prototype.hideColumns();
	}
});


// Add Google Analytics KPI Tracking to menu items and node forms
jQuery(document).ready(function () {
	
	jQuery('.main-menu ul.menu li.last ul.menu li.first a.level-2').click (function () {
		_gaq.push(['_trackEvent','Donate','Click','Start Button']);
	});
	
	jQuery( ".page-share-your-story form#user-story-node-form" ).submit(function( event ) {
		event._gaq.push(['_trackEvent','Share Story','Click','Save Button']);
	});
	//tracking code in sidebar block on /campaigns/national-adoption-weekend
	//and /campaigns/national-adoption-weekend-b
	jQuery("#block-block-28 .block-title-link").click(function(){
		_gaq.push(['_trackEvent','Store','Click','Sidebar Link']);
	});
	jQuery("#block-block-28 .content img").click(function(){
		_gaq.push(['_trackEvent','Store','Click','Sidebar Link']);
	});
	
});

jQuery(window).load(function () {
	//on events set the group-right div to be the same height as group-left so the columns are equal height
	//group-right is set to diplay:none in css so the image doesn't get cropped after it's visible
	var height = jQuery('.node-type-event #block-system-main .group-left').height();
	jQuery('.node-type-event #block-system-main .group-right').addClass('JS-resized').height(height);
	jQuery('.node-type-event #block-system-main .group-right').show();
	
});

jQuery(document).ready(function () {
	//hide text about flash graphic on jacksonville campaign
	if(!FlashDetect.installed){
		jQuery('#hide-no-flash').hide();  	
	}
});

jQuery(document).ready(function ($) {
	//disable mousewheel increase/decrease number in phone input on share your story form
	$('#edit-user-story-redhen-contact-phone').on('mousewheel', function(e){
    e.preventDefault();
	});
});









;
(function ($) {
  Drupal.behaviors.toggleVisibleFront = {
    attach: function (context) {
      //toggle the adopt a pet form on homepage when show/hide button clicked
      $('.front-adopt-pet-toggle', context).once().click(function(){
        jQuery('span', this).toggleClass('hidden');
		    jQuery(this).next().slideToggle();
				jQuery(this).parents('.pane-boxes-pcc-adopt-pets').toggleClass('hidden');
      });
    }
  }
})(jQuery);

(function($){
	$(document).ready(function() {
	    var targetElem1 = $('#header-top-wrapper');
	    var targetElem2 = $('#header-wrapper');
	    
	    if( !targetElem1.length || !navigator.userAgent.match(/iPhone|iPad|iPod/i) ) return;

	    $('input, textarea').focus( function() {
		targetElem1.css({'position':'absolute', 'top':'0'});
		targetElem2.css({'position':'absolute', 'top':'40'});	
	     });
	    
	     $('input, textarea').blur( function() {
		targetElem1.removeAttr('style');
		targetElem2.removeAttr('style');
	     });
	});
})(jQuery);
;
