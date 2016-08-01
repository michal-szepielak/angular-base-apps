(function() {
  'use strict';

  angular.module('foundation.tabs', ['foundation.core'])
    .controller('ZfTabsController', ZfTabsController)
    .directive('zfTabs', zfTabs)
    .directive('zfTabContent', zfTabContent)
    .directive('zfTab', zfTab)
    .directive('zfTabIndividual', zfTabIndividual)
    .directive('zfTabHref', zfTabHref)
    .directive('zfTabCustom', zfTabCustom)
    .directive('zfTabContentCustom', zfTabContentCustom)
    .service('FoundationTabs', FoundationTabs)
  ;

  angular.module('base.tabs', ['base.core'])
    .controller('ZfTabsController', ZfTabsController)
    .directive('zfTabs', zfTabs)
    .directive('zfTabContent', zfTabContent)
    .directive('zfTab', zfTab)
    .directive('zfTabIndividual', zfTabIndividual)
    .directive('zfTabHref', zfTabHref)
    .directive('zfTabCustom', zfTabCustom)
    .directive('zfTabContentCustom', zfTabContentCustom)
    .service('FoundationTabs', FoundationTabs)
  ;

  FoundationTabs.$inject = ['FoundationApi'];

  function FoundationTabs(foundationApi) {
    var service    = {};

    service.activate = activate;

    return service;

    //target should be element ID
    function activate(target) {
      foundationApi.publish(target, 'show');
    }

  }

  ZfTabsController.$inject = ['$scope', 'FoundationApi'];

  function ZfTabsController($scope, foundationApi) {
    var controller  = this;
    var tabs        = controller.tabs = $scope.tabs = [];
    var id          = '';
    var autoOpen    = true;
    var collapsible = false;

    controller.select = function(selectTab) {
      tabs.forEach(function(tab) {
        if(tab.scope === selectTab) {
          if (collapsible) {
            tab.active = !tab.active;
            tab.scope.active = !tab.scope.active;
          } else {
            tab.active = true;
            tab.scope.active = true;
          }

          if (tab.active) {
            foundationApi.publish(id, ['activate', tab.scope.id]);
          } else {
            foundationApi.publish(id, ['deactivate', tab.scope.id]);
          }
        } else {
          tab.active = false;
          tab.scope.active = false;
        }
      });
    };

    controller.addTab = function addTab(tabScope) {
      tabs.push({ scope: tabScope, active: false, parentContent: controller.id });

      if(tabs.length === 1 && autoOpen) {
        tabs[0].active = true;
        tabScope.active = true;
      }
    };

    controller.getId = function() {
      return id;
    };

    controller.setId = function(newId) {
      id = newId;
    };

    controller.setAutoOpen = function(val) {
      autoOpen = val;
    };

    controller.setCollapsible = function(val) {
      collapsible = val;
    };
  }

  zfTabs.$inject = ['FoundationApi'];

  function zfTabs(foundationApi) {
    var directive = {
      restrict: 'EA',
      transclude: 'true',
      replace: true,
      templateUrl: 'components/tabs/tabs.html',
      controller: 'ZfTabsController',
      scope: {
        displaced: '@?'
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      scope.id = attrs.id || foundationApi.generateUuid();
      scope.showTabContent = scope.displaced !== 'true';
      attrs.$set('id', scope.id);
      controller.setId(scope.id);
      controller.setAutoOpen(attrs.autoOpen !== "false");
      controller.setCollapsible(attrs.collapsible === "true");

      //update tabs in case tab-content doesn't have them
      var updateTabs = function() {
        foundationApi.publish(scope.id + '-tabs', scope.tabs);
      };

      foundationApi.subscribe(scope.id + '-get-tabs', function() {
        updateTabs();
      });

      scope.$on("$destroy", function() {
        foundationApi.unsubscribe(scope.id + '-get-tabs');
      });
    }
  }

  zfTabContent.$inject = ['FoundationApi'];

  function zfTabContent(foundationApi) {
    var directive = {
      restrict: 'A',
      transclude: 'true',
      replace: true,
      scope: {
        tabs: '=?',
        target: '@'
      },
      templateUrl: 'components/tabs/tab-content.html',
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      scope.tabs = scope.tabs || [];
      var id = scope.target;

      foundationApi.subscribe(id, function(msg) {
        if(msg[0] === 'activate') {
          scope.tabs.forEach(function (tab) {
            tab.scope.active = false;
            tab.active = false;

            if(tab.scope.id == msg[1]) {
              tab.scope.active = true;
              tab.active = true;
            }
          });
        } else if (msg[0] === 'deactivate') {
          scope.tabs.forEach(function (tab) {
            tab.scope.active = false;
            tab.active = false;
          });
        }
      });

      //if tabs empty, request tabs
      if(scope.tabs.length === 0) {
        foundationApi.subscribe(id + '-tabs', function(tabs) {
          scope.tabs = tabs;
        });

        foundationApi.publish(id + '-get-tabs', '');
      }

      scope.$on("$destroy", function() {
        foundationApi.unsubscribe(id);
        foundationApi.unsubscribe(id + '-tabs');
      });
    }
  }

  zfTab.$inject = ['FoundationApi'];

  function zfTab(foundationApi) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/tabs/tab.html',
      transclude: true,
      scope: {
        title: '@'
      },
      require: '^zfTabs',
      replace: true,
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller, transclude) {
      scope.id = attrs.id || foundationApi.generateUuid();
      scope.active = false;
      scope.transcludeFn = transclude;
      controller.addTab(scope);

      foundationApi.subscribe(scope.id, function(msg) {
        if(msg === 'show' || msg === 'open' || msg === 'activate') {
          if (!scope.active) {
            controller.select(scope);
          }
        }

        if(msg === 'hide' || msg === 'close' || msg === 'deactivate') {
          if (scope.active) {
            controller.select(scope);
          }
        }

        if(msg === 'toggle') {
          controller.select(scope);
        }
      });

      scope.makeActive = function() {
        controller.select(scope);
      };

      scope.$on("$destroy", function() {
        foundationApi.unsubscribe(scope.id);
      });
    }
  }

  zfTabIndividual.$inject = ['FoundationApi'];

  function zfTabIndividual(foundationApi) {
    var directive = {
      restrict: 'EA',
      transclude: 'true',
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller, transclude) {
      var tab = scope.$eval(attrs.tab);
      var id = tab.scope.id;

      tab.scope.transcludeFn(tab.scope, function(tabContent) {
        element.append(tabContent);
      });

      foundationApi.subscribe(tab.scope.id, function(msg) {
        foundationApi.publish(tab.parentContent, ['activate', tab.scope.id]);
        scope.$apply();
      });

      scope.$on("$destroy", function() {
        foundationApi.unsubscribe(tab.scope.id);
      });
    }
  }

  //custom tabs

  zfTabHref.$inject = ['FoundationApi'];

  function zfTabHref(foundationApi) {
    var directive = {
      restrict: 'A',
      replace: false,
      link: link
    }

    return directive;

    function link(scope, element, attrs, controller) {
      var target = attrs.zfTabHref;

      foundationApi.subscribe(target, function(msg) {
        if(msg === 'activate' || msg === 'show' || msg === 'open') {
          makeActive();
        }
      });


      element.on('click', function(e) {
        foundationApi.publish(target, 'activate');
        makeActive();
        e.preventDefault();
      });

      function makeActive() {
        element.parent().children().removeClass('is-active');
        element.addClass('is-active');
      }
    }
  }

  zfTabCustom.$inject = ['FoundationApi'];

  function zfTabCustom(foundationApi) {
    var directive = {
      restrict: 'A',
      replace: false,
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller, transclude) {
      var children = element.children();
      angular.element(children[0]).addClass('is-active');
    }
  }

  zfTabContentCustom.$inject = ['FoundationApi'];

  function zfTabContentCustom(foundationApi) {
    return {
      restrict: 'A',
      link: link
    };

    function link(scope, element, attrs) {
      var tabs = [];
      var children = element.children();

      angular.forEach(children, function(node) {
        if(node.id) {
          var tabId = node.id;
          tabs.push(tabId);
          foundationApi.subscribe(tabId, function(msg) {
            if(msg === 'activate' || msg === 'show' || msg === 'open') {
              activateTabs(tabId);
            }
          });

          if(tabs.length === 1) {
            var el = angular.element(node);
            el.addClass('is-active');
          }
        }
      });

      function activateTabs(tabId) {
        var tabNodes = element.children();
        angular.forEach(tabNodes, function(node) {
          var el = angular.element(node);
          el.removeClass('is-active');
          if(el.attr('id') === tabId) {
            el.addClass('is-active');
          }
        });
      }
    }
  }

})();