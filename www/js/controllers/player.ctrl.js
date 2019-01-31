// Player

angular.module('rewind.controllers').controller('PlayerCtrl', function (AppConfig, $scope, rewindPlayer, $ionicHistory, $cordovaStatusbar, $ionicGesture, $ionicViewSwitcher, rewindConfig) {

    $scope.player = rewindPlayer;

    // insert from directive
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

    // Swipe down to go back
    var playerContainer = angular.element(document.getElementById('player'));
    $ionicGesture.on('swipedown', function (e) {
        $ionicViewSwitcher.nextDirection('back');
        $ionicHistory.goBack(-1);
    }, playerContainer);

});