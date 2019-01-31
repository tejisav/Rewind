angular.module('rewind.directives').directive('playlistBar', function ($ionicScrollDelegate, $timeout, rewindConfig) {
    return {
        restrict: 'E',
        templateUrl: 'templates/playlistBar.html',
        scope: {},
        controller: function ($scope, $ionicScrollDelegate, rewindPlayer) {
            $scope.miniaturesPath = rewindConfig.appRootStorage + 'miniatures/';
            $scope.player = rewindPlayer;
            var scrollToCurrentTitle = function () {
                var delegate = $ionicScrollDelegate.$getByHandle('playlistBarScroll');
                delegate.scrollTo($scope.player.playlistIndex * 100, 0, true);
            };
            $timeout(function () {
                $scope.$watch('player.playlistIndex', scrollToCurrentTitle);
                scrollToCurrentTitle();
            }, 700);
        }
    };
});

angular.module('rewind.directives').directive('playBar', function ($state, $ionicViewSwitcher, rewindConfig, rewindPlayer, rewindDB) {
    return {
        restrict: 'E',
        templateUrl: 'templates/playBar.html',
        scope: {
        },
        controller: function ($scope) {
            $scope.player = rewindPlayer;
            $scope.miniaturesPath = rewindConfig.appRootStorage + 'miniatures/';
            $scope.openPlayer = function () {
                if (rewindPlayer.media) {
                    $ionicViewSwitcher.nextDirection('forward');
                    $state.go('player');
                }
            };
        }
    };
});

angular.module('rewind.directives').directive('artworkMosaic', function ($state, rewindConfig) {
    return {
        restrict: 'A',
        templateUrl: 'templates/artwork-mosaic.html',
        scope: {
            title: "@",
            songs: "="
        },
        controller: function ($scope) {
            $scope.miniaturesPath = rewindConfig.appRootStorage + 'miniatures/';
        }
    };
});


angular.module('rewind.directives').directive('playSquare', function ($state, rewindPlayer, rewindConfig) {
    return {
        restrict: 'E',
        templateUrl: 'templates/play-square.html',
        replace: true,
        scope: {
        },
        controller: function ($scope, rewindPlayer, $ionicGesture, rewindConfig) {
            $scope.artworksPath = rewindConfig.appRootStorage + 'artworks/';
            var artworkElement = angular.element(document.getElementById("player-box"));
            var windowWidth = 300;
            $scope.seeking = false;

            // Update position
            var onUpdate = function (position) {
                $scope.position = position;
                if ($scope.duration > 0) {
                    $scope.progress = ($scope.position / $scope.duration);
                    $scope.rangeprogress = $scope.progress * 100;
                    $scope.rangeposition = Math.floor(position / 1000);
                } else {
                    $scope.progress = 0;
                    $scope.rangeprogress = 0;
                    $scope.rangeposition = position;
                }
            };

            // Update scope on new title
            var onNewTitle = function () {
                $scope.player = rewindPlayer;
                $scope.position = 0;
                $scope.progress = 0;

                rewindPlayer.getDuration().then(function (duration) {
                    $scope.duration = duration;
                    $scope.durationMax = Math.floor(duration / 1000);

                });
            };

            onNewTitle();
            rewindPlayer.setOnUpdate(onUpdate);
            rewindPlayer.setOnTitleChange(onNewTitle);


            $scope.stateChanged = function () {
                $scope.progress1 = ($scope.position / $scope.duration);
                rewindPlayer.seek($scope.progress1);
                if (rewindPlayer.playing) {
                    rewindPlayer.startWatchTime();
                    rewindPlayer.media.play();
                }
            };

            $ionicGesture.on('dragleft dragright', function (event) {
                if (!$scope.seeking) {
                    $scope.seeking = true;
                    if (rewindPlayer.playing) {
                        rewindPlayer.stopWatchTime();
                        rewindPlayer.media.pause();
                    }
                }
                $scope.$apply(function () {
                    $scope.progress = event.gesture.center.pageX / windowWidth;
                    $scope.position = $scope.progress * $scope.duration;

                });
            }, artworkElement);

            $ionicGesture.on('dragend', function () {
                if ($scope.seeking) {
                    $scope.seeking = false;
                    rewindPlayer.seek($scope.progress);
                    if (rewindPlayer.playing) {
                        rewindPlayer.startWatchTime();
                        rewindPlayer.media.play();
                    }
                }
            }, artworkElement);
        }
    };
});