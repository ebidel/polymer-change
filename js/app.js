(function() {

var rafId = null;
var PREFIXES = {
  'webkit': 'WebKit',
  'moz': 'Moz',
  'ms': 'MS',
  'o': 'O'
};

var transEndEventNames = {
  'WebkitTransition': 'webkitTransitionEnd',
  'MozTransition': 'transitionend',
  'OTransition': 'oTransitionEnd',
  'msTransition': 'MSTransitionEnd',
  'transition': 'transitionend'
};

window.requestAnimationFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame;

window.cancelAnimationFrame = window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame ||
    window.msCancelAnimationFrame || window.oCancelAnimationFrame;

// Find the correct transitionEnd vendor prefix.
window.transEndEventName = transEndEventNames[Modernizr.prefixed('transition')];

window.$ = function(selector, opt_scope) {
  var scope = opt_scope || document;
  return scope.querySelector(selector);
};

window.$$ = function(selector, opt_scope) {
  var scope = opt_scope || document;
  return Array.prototype.slice.call(scope.querySelectorAll(selector) || []);
};

HTMLElement.prototype.$_ = function(selector) {
  return $(selector, this);
};

HTMLElement.prototype.$$_ = function(selector) {
  return $$(selector, this);
};

HTMLElement.prototype.listen = HTMLElement.prototype.addEventListener;
document.listen = document.addEventListener;

// If DOM is ready, run our setup. Otherwise wait for it to finish.
if (document.readyState === 'complete') {
  initContent();
} else {
  document.listen('readystatechange', function() {
    if (document.readyState === 'complete') {
      initContent();
    }
  });
}


function addVendorPrefixes() {
  $$('[data-tooltip-property]').forEach(function(tip, i) {
    var property  = tip.dataset.tooltipProperty;

    var support = Object.keys(PREFIXES); // Default to all prefixes if support array is missing.
    var includeUnprefixedVersion = false;
    if (tip.dataset.tooltipSupport) {
      support = JSON.parse(tip.dataset.tooltipSupport);
      // A 'unprefix' in the array indicates not to include unprefixed property.
      var idx = support.indexOf('unprefixed');
      if (idx != -1) {
        includeUnprefixedVersion = true;
        support.splice(idx, 1);
      }
    }

    var str = ['/* Requires vendor prefixes. */'];

    if ('tooltipJs' in tip.dataset) {
      tip.href = 'http://caniuse.com/#search=' + property;

      support.forEach(function(prefix, i) {
        // Capitalized Properties should remain so, unless explicitly called out.
        if (property[0] == property[0].toUpperCase() &&
            !('tooltipLowercase' in tip.dataset)) {
          var val = PREFIXES[prefix] + property;
        } else {
          var upperCasedProperty = property[0].toUpperCase() + property.substring(1);
          var val = prefix + upperCasedProperty;
        }
        if (!('tooltipJsProperty' in tip.dataset)) {
          val += '(...);';
        }
        str.push(val);
      });

      if (includeUnprefixedVersion) {
        str.push(property + '(...);');
      }

    } else {
      tip.href = 'http://sass-lang.com/docs/yardoc/file.SASS_REFERENCE.html#including_a_mixin';

      support.forEach(function(prefix, i) {
        str.push('-' + prefix + '-' + property);// + ': ...');

      });
      
      str.push(property);// + ': ...'); // Include unprefixed property by default for CSS.
    }

    tip.dataset.tooltip = str.join('\n');
    tip.role = 'tooltip';
    tip.innerHTML = '<span class="property">' +
                    //(!('tooltipJs' in tip.dataset) ? '+' : '') + property +
                    property +
                    '</span>';
    tip.dataset.tooltipActive = '';
  });
}

function fetchAndInjectSamples() {

  var pres = $$('pre[data-url]');

  pres.forEach(function(pre, i) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', pre.dataset.url);

    xhr.onloadend = function(e) {
      if (e.target.status == 200) {
        pre.textContent = e.target.response + pre.textContent;
        if (i == pres.length - 1) {
          prettyPrint();
        }
      }
    };

    xhr.send();
  });
}

function setupSnippetDemos() {

  var pres = $$('pre[data-run-demo]');

  pres.forEach(function(pre, i) {
    var a = document.createElement('a');
    a.href = pre.dataset.runDemo;
    //a.textContent = 'RUN DEMO';
    a.classList.add('snippet-demo');
    pre.appendChild(a);
  });
}


// DOM Ready business.
function initContent(e) {
  var currentSlide = slidedeck.slides[slidedeck.curSlide_];
  if (currentSlide.classList.contains('nobackdrop')) {
    document.body.classList.add('nobackdrop');
  }
  if (currentSlide.dataset.bodyClass) {
    var classes = currentSlide.dataset.bodyClass.split(' ');
    classes.forEach(function(c) {
      document.body.classList.add(c);
    });
  }

  slidedeck.container.listen('slideenter', function(e) {
    var slide = e.target;
    if (slide.classList.contains('nobackdrop')) {
      document.body.classList.add('nobackdrop');
    }

    if (slide.dataset.bodyClass) {
      var classes = slide.dataset.bodyClass.split(' ');
      classes.forEach(function(c) {
        document.body.classList.add(c);
      });
    }
  });

  slidedeck.container.listen('slideleave', function(e) {
    var slide = e.target;
    if (slide.classList.contains('nobackdrop')) {
      document.body.classList.remove('nobackdrop');
    }
    if (slide.dataset.bodyClass) {
      var classes = slide.dataset.bodyClass.split(' ');
      classes.forEach(function(c) {
        document.body.classList.remove(c);
      });
    }

  });

  document.listen('keydown', function(e) {
    switch (e.keyCode) {
      case 80: // P
        document.body.classList.toggle('with-devtools');
        break;
      default:
        break;
    }
  }, false);

  // Writing in markdown leaves off the .prettyprint class. Find those that
  // don't have the class and get em colored.
  $$('pre:not(.prettyprint)').forEach(function(pre, i) {
    pre.classList.add('prettyprint');
  });

  fetchAndInjectSamples(); // pulls custom element samples files into pre tags.

  addVendorPrefixes(); // adds vendor prefix tooltips

  setupSnippetDemos();

  prettyPrint();

  initDemos();
}

})();


// Inline slide examples -------------------------------------------------------

function initDemos() {
  // (function() {
  //   var slide = $('#netscape');

  //   var clone = slide.$_('#formexample').content.cloneNode(true);
  //   var div = document.createElement('div');
  //   div.appendChild(clone);
  //   slide.$_('#formframe').srcdoc = div.innerHTML;
  // })();

  (function() {
    var slide = $('#buildingblocks');
    var audio = slide.$_('audio');

    slide.listen('slideenter', function(e) {
      audio.load();
      audio.play();
    });

    slide.listen('slideleave', function() {
      audio.pause();
    });

    // If this slide is current on pageload, start playing video.
    if (slidedeck.slides[slidedeck.curSlide_] == slide) {
      audio.play();
    }
  })();

  // (function() {
  //   var slide = $('#mapstoday');
  //   var code = slide.$_('pre');
  //   var items = code.$$_('[data-scroll-index]');

  //   var scrollIndex = 1;

  //   code.addEventListener('click', function(e) {
  //     e.stopPropagation();
  //     var target = code.$_('[data-scroll-index="' + scrollIndex + '"]');
  //     target.classList.add('active');
  //     //target.scrollIntoView(true);
  //     code.scrollTop = target.offsetTop - 20;

  //     scrollIndex = (scrollIndex + 1) % items.length;
  //   });
  // })();

  (function() {
    var slide = $('#stylingels');
    var codeCycler = slide.$_('code-cycler');
    var usage = slide.$_('.usage');

    codeCycler.listen('code-snippet-change', function(e) {
      //usage.hidden = false;

      var i = e.detail.index;
      slide.$_('.component-demo core-selector').selected = i;
      slide.$_('.usage').selected = i;
    });

  })();

  // (function() {
  //   var template = $('#table-binding-example');
  //   template.users = [
  //     {name: 'Huey'},
  //     {name: 'Dewey'},
  //     {name: 'Louie'}
  //   ];
  // })();

  (function() {
    var slide = $('#google-map-slide');
    var map = slide.$_('google-map');
    
    var codeCycler = slide.$_('code-cycler');
    codeCycler.addEventListener('code-snippet-change', function(e) {
      var i = e.detail.index;

      // Reset
      if (i == 0) {
        console.log(i)
        map.zoom = 10;
        map.latitude = 37.3894;
        map.longitude = -122.0819;
        map.clear();
        map.innerHTML = '';
        codeCycler.classList.remove('slidedown');
      }

      map.classList.toggle('show', i >= 1);

      var action = e.target.codeblocks[e.target.selected].dataset.action;

      switch(action) {
        case 'location':
          map.latitude = 37.77493;
          map.longitude = -122.41942;
          //map.showCenterMarker = true;
          break;
        case 'zoom':
          map.zoom = 15;
          break;
        case 'geolocation':
          var geo = document.createElement('geo-location');
          geo.addEventListener('geo-response', function() {
            map.latitude = this.latitude;
            map.longitude = this.longitude;
          });
          break;
        case 'markers':
          var m = document.createElement('google-map-marker');
          m.title = "Home";
          m.draggable = true;
          m.latitude = 37.78120092816254;
          m.longitude = -122.41924074096676;
          map.appendChild(m);
          break;
        case 'markers2':
          codeCycler.classList.add('slidedown');

          var m = document.createElement('google-map-marker');
          m.latitude = 37.779;
          m.longitude = -122.3892;
          //m.title = 'Go Giants!';
          m.innerHTML = '<h2>Go Giants!</h2><img src="http://upload.wikimedia.org/wikipedia/commons/thumb/4/49/San_Francisco_Giants_Cap_Insignia.svg/200px-San_Francisco_Giants_Cap_Insignia.svg.png">';
          m.icon = '../images/icons/baseball.png';
          map.appendChild(m);
          break;
        case 'fit':
          google.maps.event.addDomListenerOnce(map.map, 'bounds_changed', function() {
            map.map.panBy(0, 150);  
          });

          map.fitToMarkers = true;
          break;
        case 'nyc':

          google.maps.event.addDomListenerOnce(map.map, 'bounds_changed', function() {
            map.map.panBy(0, 150);  
          });

          var m = document.createElement('google-map-marker');
          m.latitude = 40.6700;
          m.longitude = -73.9780035;
          m.title = 'NYC';
          map.appendChild(m);
          break;
        default:
          // var m = document.createElement('google-map-marker');
          // m.draggable = true;
          // m.latitude = 37.77520092816254;
          // m.longitude= -122.41924074096676;
          // map.appendChild(m);
          break;
      }
    });

  })();

  // (function() {
  //   var slide = $('#how-polymer-uses-custom-els');
  //   var template = slide.$_('template[is="auto-binding"]');
  //   // template.selectedIndex = 1;

  // })();

  // (function() {
  //   var slide = $('#hangoutsexample');
  //   var output = slide.$_('.example');
  //   var count = 0;

  //   // slide.querySelector('.snippet-demo').listen('click', function(e) {
  //   //   e.preventDefault();
  //   // });

  //   slide.querySelector('button').addEventListener('click', function(e) {

  //     if (!count) {
  //       var hangout = document.createElement('hangout-module');
  //       hangout.from = 'Larry Page';
  //       //hangout.profile = '118075919496626375791';
  //       hangout.profile = 'http://lh5.googleusercontent.com/-kgFnix5akCc/AAAAAAAAAAI/AAAAAAAAOqk/IVG-V3nJ8jM/photo.jpg?sz=40';


  //       hangout.messages = [{
  //         // profile: '106189723444098348646',
  //         profile: 'http://lh3.googleusercontent.com/-Y86IN-vEObo/AAAAAAAAAAI/AAAAAAACk4w/yvxY4GMx_8k/photo.jpg?sz=40',
  //         datetime: new Date().toISOString(),
  //         isother: true,
  //         msg: ['Hola', 'Web components are amazing!']
  //       }];

  //       output.appendChild(hangout);
  //     } else {
  //       var hangout = document.createElement('hangout-module');
  //       hangout.from = 'Paul Irish';
  //       // hangout.profile = '118075919496626375791';
  //       hangout.profile = 'http://lh5.googleusercontent.com/-kgFnix5akCc/AAAAAAAAAAI/AAAAAAAAOqk/IVG-V3nJ8jM/photo.jpg?sz=40';


  //       hangout.messages = [{
  //         // profile: '113127438179392830442',
  //         profile: 'http://lh3.googleusercontent.com/-7jdZCLeEaho/AAAAAAAAAAI/AAAAAAAAZIw/GMkOu6gF6SA/photo.jpg?sz=40',
  //         datetime: '2014-03-12T10:02',
  //         isother: true,
  //         msg: ["Feelin' this Web Components thing.", "Heard anything about it?"]
  //       }, {
  //         // profile: '118075919496626375791',
  //         profile: 'http://lh5.googleusercontent.com/-kgFnix5akCc/AAAAAAAAAAI/AAAAAAAAOqk/IVG-V3nJ8jM/photo.jpg?sz=40',
  //         datetime: '2013-06-24T10:03',
  //         msg: ['Totes amazing']
  //       }, {
  //         //profile: '118075919496626375791',
  //         profile: 'http://lh5.googleusercontent.com/-kgFnix5akCc/AAAAAAAAAAI/AAAAAAAAOqk/IVG-V3nJ8jM/photo.jpg?sz=40',
  //         datetime: '2014-03-12T10:05',
  //         msg: ['Have you tried Polymer yet?']
  //       }, {
  //         //profile: '113127438179392830442',
  //         profile: 'http://lh3.googleusercontent.com/-7jdZCLeEaho/AAAAAAAAAAI/AAAAAAAAZIw/GMkOu6gF6SA/photo.jpg?sz=40',
  //         datetime: '2014-03-12T10:06',
  //         isother: true,
  //         msg: ['Naw Bro', "I'll give it a spin"]
  //       }];

  //       output.appendChild(hangout);
  //     }

  //     count++;
    
  //   });

  // })();

  // (function() {
  //   var slides = $$('slide.googlecomtoday');

  //   var onTransEnd_ = function(e) {
  //     if (!this.classList.contains('current')) {
  //       return;
  //     }
  //     if (e.propertyName == '-webkit-transform' ||
  //         e.propertyName == '-moz-transform' ||
  //         e.propertyName == '-ms-transform' ||
  //         e.propertyName == 'transform') {
  //       slidedeck.nextSlide();
  //       this.classList.remove('active');
  //     }
  //   };

  //   slides.forEach(function(slide, i) {
  //     slide.listen('click', function() {
  //       this.classList.add('active');
  //     });

  //     slide.listen(transEndEventName, onTransEnd_.bind(slide));
  //   });

  // })();

  // (function() {
  //   var slide = $('#title-slide');
  //   var video = slide.$_('video');
  //   var audio = slide.$_('audio');

  //   var PLAYBACKRATE = 2;

  //   video.listen('ended', function(e) {
  //     video.load(); // video.currentTime = 0; doesn't work.
  //     video.playbackRate = PLAYBACKRATE; // screenflow captured at 30fps. get us to 60.
  //     video.play();
  //   });

  //   slide.listen('slideenter', function(e) {
  //     if (video.currentTime >= video.duration) {
  //       video.load();
  //     }
  //     video.playbackRate = PLAYBACKRATE;
  //     video.play();
  //     audio.play();
  //   });

  //   slide.listen('slideleave', function() {
  //     video.pause();
  //     audio.pause();
  //   });

  //   // If this slide is current on pageload, start playing video.
  //   if (slidedeck.slides[slidedeck.curSlide_] == slide) {
  //     video.playbackRate = PLAYBACKRATE;
  //     video.play();
  //     audio.play();
  //   }
  // })();

  (function() {
    var slide = $('#platform-polyfills');
    slide.listen('slidebuild', function(e) {
      var rows = $$('.browser-support-row div', slide);
      rows.forEach(function(row) {
        row.classList.add('supported');
        row.classList.remove('partial');
      });
      var date = slide.$_('hgroup h2 label');
      date.textContent = "platform.js polyfills";
    });
  })();

  // (function() {
  //   var slide = $('#spacevideo');
  //   var video = slide.$_('video');
  //   var audio = slide.$_('audio');

  //   var PLAYBACKRATE = 2;

  //   video.listen('ended', function(e) {
  //     video.load(); // video.currentTime = 0; doesn't work.
  //     video.playbackRate = PLAYBACKRATE; // screenflow captured at 30fps. get us to 60.
  //     video.play();
  //   });

  //   slide.listen('slideenter', function(e) {
  //     if (video.currentTime >= video.duration) {
  //       video.load();
  //     }
  //     video.playbackRate = PLAYBACKRATE;
  //     video.play();
  //     audio.play();
  //   });

  //   slide.listen('slideleave', function() {
  //     video.pause();
  //     audio.pause();
  //   });

  //   // If this slide is current on pageload, start playing video.
  //   if (slidedeck.slides[slidedeck.curSlide_] == slide) {
  //     video.playbackRate = PLAYBACKRATE;
  //     video.play();
  //     audio.play();
  //   }
  // })();

  // (function() {
  //   var slide = $('#spacevideo2');
  //   var video = slide.$_('video');
  //   var audio = slide.$_('audio');

  //   var PLAYBACKRATE = 1;

  //   video.listen('ended', function(e) {
  //     video.load(); // video.currentTime = 0; doesn't work.
  //     video.playbackRate = PLAYBACKRATE; // screenflow captured at 30fps. get us to 60.
  //     video.play();
  //   });

  //   slide.listen('click', function() {
  //     video.playbackRate = PLAYBACKRATE; // screenflow captured at 30fps. get us to 60.
  //     video.paused ? video.play() : video.pause();
  //     audio.paused ? audio.play() : audio.pause();
  //   });

  //   slide.listen('slideleave', function() {
  //     video.pause();
  //     audio.pause();
  //   });

  //   // // If this slide is current on pageload, start playing video.
  //   // if (slidedeck.slides[slidedeck.curSlide_] == slide) {
  //   //   video.playbackRate = PLAYBACKRATE;
  //   //   video.play();
  //   //   audio.play();
  //   // }
  // })();

  (function() {
    var slide = $('#tabsexample');
    var tabs = slide.$_('paper-tabs');
    var output = slide.$_('output');

    // slide.listen('slideenter', function() {
    //   document.body.classList.add('colorize');
    // });

    // slide.listen('slideleave', function() {
    //   document.body.classList.remove('colorize');
    // });

    output.listen('transitionend', function(e) {
      output.innerHTML = '';
      output.classList.remove('fadeout');
      // document.body.classList.remove('googlegray');
    });

    tabs.listen('core-activate', function(e) {
      // document.body.classList.add('googlegray');
      output.classList.add('fadeout'); 
      output.innerHTML = '"' + e.type + '"';
    });
  })();


  (function() {
    var slide = $('#tools-video');
    var video = slide.$_('video');

    var PLAYBACKRATE = 1;

    video.listen('ended', function(e) {
      video.load(); // video.currentTime = 0; doesn't work.
      video.playbackRate = PLAYBACKRATE; // screenflow captured at 30fps. get us to 60.
      video.play();
    });

    slide.listen('click', function() {
      video.playbackRate = PLAYBACKRATE; // screenflow captured at 30fps. get us to 60.
      video.paused ? video.play() : video.pause();
    });

    slide.listen('slideleave', function() {
      video.pause();
    });
  })();

  (function() {
    var slide = $('#paperexamples');
    var template = slide.$_('template[is="auto-binding"]');
    var progress = slide.$_('paper-progress');
    var shadow = slide.$_('paper-shadow');
    template.z = 1;
    
    // template.increaseZ = function() {
    //   this.z = (this.z + 1) % 6;
    // }

    var repeat, maxRepeat = 5;
    
    function nextProgress() {
      if (progress.value < progress.max) {
        progress.value += (progress.step || 10);
      } else {
        if (++repeat >= maxRepeat) {
          return;
        }
        progress.value = progress.min;
        shadow.z = (shadow.z + 1) % 6;
        Platform.flush();
      }
      requestAnimationFrame(nextProgress);
    }
    
    function startProgress() {
      repeat = 0;
      progress.value = progress.min;
      nextProgress();
    }

    slide.listen('slideenter', function() {
      startProgress();
    });


  })();

  (function() {
    var slide = $('#responsivelements');
    var video = slide.$_('video');

    video.listen('ended', function(e) {
      video.load(); // video.currentTime = 0; doesn't work.
      video.play();
    });

    slide.listen('slideenter', function(e) {
      if (video.currentTime >= video.duration) {
        video.load();
      }
      video.play();
    });

    slide.listen('slideleave', function() {
      video.pause();
    });

    // If this slide is current on pageload, start playing video.
    if (slidedeck.slides[slidedeck.curSlide_] == slide) {
      video.play();
    }
  })();
}

