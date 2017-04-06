var app = angular.module('myApp', ['ngRoute']);
app.controller('MainController', function ($scope, $route, $routeParams, $location) {
    $scope.$route = $route;
    $scope.$location = $location;
    $scope.$routeParams = $routeParams;
});

app.controller('myCtrl', function ($scope, $http) {
    $scope.selectedEntries = {};
    $http.get("/api/devices")
            .then(function (response) {
                $scope.devices = response.data;
            });

    $http.get("/api/groups")
            .then(function (response) {
                $scope.groups = response.data;
            });

    $scope.disableActionDropdown = true;

    $scope.assignDevicesToGroup = function (group) {
        console.log("Group", group);
        console.log($scope.devices);
        var deviceKeys = Object.keys($scope.selectedEntries);
        for (var i = 0; i < $scope.devices.length; i++) {
            if ($scope.selectedEntries[$scope.devices[i].imei]) {
                // Yes, this IMEI is selected
                console.log("Yes, IMEI " + $scope.devices[i].imei + " is selected.");
                $scope.devices[i].group = group.name;

                // Save to backend
                $http.put("/api/device/" + $scope.devices[i]._id, $scope.devices[i]);

            }
        }
        toastr.success('Group membership changed');

    }



    $scope.rowClicked = function (entry) {
        console.log("Change entry", entry);
        if (!$scope.selectedEntries[entry.imei]) {
            $scope.selectedEntries[entry.imei] = entry;
        } else if ($scope.selectedEntries[entry.imei]) {
            delete $scope.selectedEntries[entry.imei];

        }
        if (Object.keys($scope.selectedEntries).length > 0) {
            $scope.disableActionDropdown = false;
        } else {
            $scope.disableActionDropdown = true;

        }
        console.log($scope.selectedEntries);
    }



});

app.controller('remoteConfigCtrl', function ($scope, $http) {
    $scope.configname = '';
    $scope.setGroup = function (group) {
        $scope.configname = group.name;
        $scope.config = group.config;
        $scope._id = group._id;
    };
    $scope.putConfig = function () {
        $http.put("/api/groups/" + $scope._id, $scope.config).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
            toastr.success('Group <b>'+ $scope.configname + '</b> saved successfully');

            // Reload groups

        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            toastr.error("Group failed saving", response);
        });
    };
    $http.get("/api/groups")
            .then(function (response) {
                $scope.groups = response.data;
                $scope.setGroup(response.data[0]);
            });


    $scope.newGroup = function () {
        console.log("Add group, name", $scope.newGroupName);
        $http.put("/api/group", JSON.stringify({groupName: $scope.newGroupName})).then(
            function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                toastr.success('Group ' + $scope.newGroupName + ' created successfully');
                $scope.newGroupName = "";

                // Reload groups
                $http.get("/api/groups")
                        .then(function (response) {
                            $scope.groups = response.data;
                        });

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                toastr.error("Group creation failed", response);
            }
        );
    }
});

app.controller('softwareConfigCtrl', function ($scope, $http) {
    $scope.configname = '';
    $scope.setGroup = function (group) {
        $scope.configname = group.name;
        $scope.software = group.software;
        $scope._id = group._id;
    };
    $scope.putSoftware = function () {
        $http.put("/api/group/software/" + $scope._id, $scope.software).then(
            function successCallback(response) {
                toastr.success('Software configuration updated for group <b>' + $scope.configname + '</b>');

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                toastr.error("Update software configuration failed", response);
            }
        );
    };
    $http.get("/api/groups")
            .then(function (response) {
                $scope.groups = response.data;
                $scope.setGroup(response.data[0]);
            });
});

app.config(function ($routeProvider, $locationProvider) {
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

app.directive('bsHasError', [function () {
        return {
            restrict: "A",
            link: function (scope, element, attrs, ctrl) {
                var input = element.find('input[ng-model]');
                if (input.length) {
                    scope.$watch(function () {
                        return input.hasClass('ng-invalid');
                    }, function (isInvalid) {
                        input.toggleClass('has-danger', isInvalid);
                        //console.log(input.hasClass('has-error'));
                    });

                }
            }
        };
    }]);

app.directive('showValidation', [function () {
        return {
            restrict: "A",
            link: function (scope, element, attrs, ctrl) {

                element.find('.form-group').each(function (i, formGroup) {
                    showValidation(angular.element(formGroup));
                });

                function showValidation(formGroupEl) {
                    var input = formGroupEl.find('input[ng-model],textarea[ng-model]');
                    if (input.length > 0) {
                        scope.$watch(function () {
                            return input.hasClass('ng-invalid');
                        }, function (isInvalid) {

                            formGroupEl.toggleClass('has-danger', isInvalid);
                        });
                    }
                }
            }
        };
    }]);

app.directive('convertToNumber', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function (val) {
                return parseInt(val, 10);
            });
            ngModel.$formatters.push(function (val) {
                return '' + val;
            });
        }
    };
});