var app = angular.module('myApp',  ['ngRoute']);
app.controller('MainController', function($scope, $route, $routeParams, $location) {
     $scope.$route = $route;
     $scope.$location = $location;
     $scope.$routeParams = $routeParams;
 });

app.controller('myCtrl', function($scope, $http) {
  $http.get("/api/devices")
  .then(function(response) {
      $scope.devices = response.data;
  });
});

app.controller('remoteConfigCtrl', function($scope, $http) {
    $scope.configname = '';
    $scope.setGroup = function(group){
        $scope.configname = group.name;
        $scope.config = group.config;
        $scope._id = group._id;
    };
    $scope.putConfig = function(){
        $http.put("/api/groups/"+$scope._id, $scope.config);
        toastr.success('Saved');
    };
  $http.get("/api/groups")
  .then(function(response) {
      $scope.groups = response.data;
      $scope.setGroup(response.data[0]);
  });
});

app.controller('softwareConfigCtrl', function($scope, $http) {
    $scope.configname = '';
    $scope.setGroup = function(group){
        $scope.configname = group.name;
        $scope.software = group.software;
        $scope._id = group._id;
    };
    $scope.putSoftware = function(){
        $http.put("/api/group/software/"+$scope._id, $scope.software);
        toastr.success('Saved');
    };
  $http.get("/api/groups")
  .then(function(response) {
      $scope.groups = response.data;
      $scope.setGroup(response.data[0]);
  });
});

app.config(function($routeProvider, $locationProvider) {
  $routeProvider
  .when('/', {
    templateUrl: 'dashboard.html',
    controller: 'myCtrl'
  })
  .when('/config', {
    templateUrl: 'config.html',
    controller: 'remoteConfigCtrl'
  }).when('/software', {
    templateUrl: 'software.html',
    controller: 'softwareConfigCtrl'
  });

  // configure html5 to get links working on jsfiddle
  $locationProvider.html5Mode(true);
});

app.directive('showTab', function () {
    return {
        link: function (scope, element, attrs) {
            element.click(function (e) {
                e.preventDefault();
                jQuery(element).tab('show');
            });
        }
    };
});

app.directive('bsHasError', [function() {
  return {
      restrict: "A",
      link: function(scope, element, attrs, ctrl) {
          var input = element.find('input[ng-model]'); 
          if (input.length) {
              scope.$watch(function() {
                  return input.hasClass('ng-invalid');
              }, function(isInvalid) {
                  input.toggleClass('has-danger', isInvalid);
                  //console.log(input.hasClass('has-error'));
              });

          }
      }
  };
}]);

app.directive('showValidation', [function() {
    return {
        restrict: "A",
        link: function(scope, element, attrs, ctrl) {

            element.find('.form-group').each(function(i, formGroup) {
                    showValidation(angular.element(formGroup));
                });

            function showValidation(formGroupEl) {
                var input = formGroupEl.find('input[ng-model],textarea[ng-model]');
                if (input.length > 0) {
                    scope.$watch(function() {
                        return input.hasClass('ng-invalid');
                    }, function(isInvalid) {

                        formGroupEl.toggleClass('has-danger', isInvalid);
                    });
                }
            }
        }
    };
}]);

app.directive('convertToNumber', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(val) {
        return parseInt(val, 10);
      });
      ngModel.$formatters.push(function(val) {
        return '' + val;
      });
    }
  };
});