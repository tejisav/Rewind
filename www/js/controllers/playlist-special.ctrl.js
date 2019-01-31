// Playlist special

angular.module('rewind.controllers').controller('PlaylistSpecialCtrl', function ($scope, $stateParams, $state, rewindDB, rewindPlayer, $ionicViewSwitcher, rewindConfig, $ionicPopover, $cordovaToast, $localstorage) {

    var playlistId = $stateParams.playlistId;
    $scope.playlistName = $stateParams.playlistName;
    $scope.miniaturesPath = rewindConfig.appRootStorage + 'miniatures/';

    var loadPlaylistContent = function () {
        rewindDB.getSpecialPlaylist(playlistId, 50).then(function (playlist) {
            $scope.playlist = playlist.titles;
        });
    };
    loadPlaylistContent();

    $scope.playTitle = function (title) {
        rewindPlayer.loadPlaylist($scope.playlist);
        rewindPlayer.launchPlayer(title);
        if ($localstorage.get('goToPlayer', 'true') === 'true') {
            $ionicViewSwitcher.nextDirection('forward');
            $state.go('player');
        }
    };

    $scope.playPlaylist = function (mode) {
        rewindPlayer.loadPlaylist($scope.playlist);
        if (mode === 'shuffle') {
            rewindPlayer.shufflePlaylist();
        }
        rewindPlayer.launchPlayer(rewindPlayer.playlist[0]);
        if ($localstorage.get('goToPlayer', 'true') === 'true') {
            $ionicViewSwitcher.nextDirection('forward');
            $state.go('player');
        }
    };

    // Popover
    var selectedTitle;
    var event;
    $scope.showPopover = function (ev, title) {
        ev.stopPropagation();
        event = ev;
        selectedTitle = title;
        $ionicPopover.fromTemplateUrl('templates/title-popover.html', {
            scope: $scope,
        }).then(function (popover) {
            $scope.popover = popover;
            $scope.popover.show(event);

            // add the title to an existing playlist
            $scope.addToPlaylist = function () {
                popover.hide();
                $ionicPopover.fromTemplateUrl('templates/select-playlist-popover.html', {
                    scope: $scope,
                }).then(function (popover) {
                    // Get playlists
                    rewindDB.getPlaylistsNames().then(function (playlists) {
                        $scope.playlists = playlists;
                        $scope.popover = popover;
                        $scope.popover.show(event);
                        $scope.addTitleToPlaylist = function (playlistId) {
                            rewindDB.addTitleToPlaylist(playlistId, selectedTitle.id).then(function () {
                                $cordovaToast.showShortTop('Done !');
                                $scope.popover.hide();
                            });
                        };
                    });

                });

            };

            // Add the current title as next on the current playlist
            $scope.addNext = function () {
                rewindPlayer.setNext(selectedTitle);
                $scope.popover.hide();
                $cordovaToast.showShortTop('Done !');
            };
        });
    };

    var destroy = true;
    $scope.$on('popover.hidden', function () {
        if (destroy) {
            destroy = false;
            $scope.popover.remove().then(function () {
                $scope.popover = null;
                destroy = true;
            });
        }
    });

});