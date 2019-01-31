angular.module('rewind.controllers', []);
angular.module('rewind.directives', []);
angular.module('rewind.services', []);

angular.module('rewind', ['ionic', 'ngCordova', 'rewind.controllers', 'rewind.services', 'rewind.directives'])

	.constant("AppConfig", {
		"StatusbarColor1": "#314145",
		"StatusbarColor2": "#000000",
		"StatusbarColor3": "999999"
	})

	.run(function (AppConfig, $ionicPlatform, $cordovaStatusbar, $localstorage, $animate, $state) {

		$animate.enabled(false);

		$ionicPlatform.ready(function () {

			if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
				cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			}

			if (window.StatusBar) {
				StatusBar.styleLightContent();
			}

			if ($localstorage.get('showStatusBar', 'true') === 'false') {
				$cordovaStatusbar.hide();
			}

			if (window.StatusBar) {
				// $cordovaStatusbar.overlaysWebView(false);
				console.log("StatusbarColor1=" + AppConfig.StatusbarColor1);
				$cordovaStatusbar.styleHex(AppConfig.StatusbarColor1);
				console.log("$cordovaStatusbar= yes");
			}

			if (cordova.platformId == 'android') {

				StatusBar.backgroundColorByHexString(AppConfig.StatusbarColor1);
				console.log("StatusBar.backgroundColorByHexString = yes");
			}

			ionic.Platform.setGrade('c'); // remove advanced css feature

			$ionicPlatform.registerBackButtonAction(function (event) {
				if ($state.current.name === 'tab.playlists') {
					backAsHome.trigger(function () {
						console.log("Success: back as home");
					}, function () {
						console.log("Error: back as home");
					});
				} else {
					navigator.app.backHistory();
				}
			}, 100);
		});
	})

	.config(function ($stateProvider, $urlRouterProvider) {

		$stateProvider

			.state('tab', {
				url: "/tab",
				abstract: true,
				templateUrl: "templates/tabs.html",
			})

			.state('tab.playlists', {
				url: '/playlists',
				views: {
					'tab-playlists': {
						templateUrl: 'templates/playlists.html',
						controller: 'PlaylistsCtrl'
					}
				}
			})

			.state('tab.playlist-items', {
				url: '/playlists/user/:playlistId/:playlistName',
				views: {
					'tab-playlists': {
						templateUrl: 'templates/playlist-items.html',
						controller: 'PlaylistItemsCtrl'
					}
				}
			})

			.state('tab.playlist-special', {
				url: '/playlists/special/:playlistId/:playlistName',
				views: {
					'tab-playlists': {
						templateUrl: 'templates/playlist-items.html',
						controller: 'PlaylistSpecialCtrl'
					}
				}
			})

			.state('tab.artists', {
				url: '/artists',
				views: {
					'tab-playlists': {
						templateUrl: 'templates/artists.html',
						controller: 'ArtistsCtrl'
					}
				}
			})

			.state('titles', {
				url: '/artists/:artistId/artwork/:artworkUrl',
				templateUrl: 'templates/titles.html',
				controller: 'TitlesCtrl'
			})

			.state('tab.songs', {
				url: '/songs',
				views: {
					'tab-songs': {
						templateUrl: 'templates/songs.html',
						controller: 'SongsCtrl'
					}
				}
			})

			.state('settings', {
				url: '/settings',
				templateUrl: 'templates/settings.html',
				controller: 'SettingsCtrl'
			})


			.state('tab.manage-directories', {
				url: '/manage-directories',
				views: {
					'tab-folder': {
						templateUrl: 'templates/manage-directories.html',
						controller: 'ManageDirectoriesCtrl'
					}
				}
			})

			.state('tab.cloud', {
				url: '/cloud',
				views: {
					'tab-cloud': {
						templateUrl: 'templates/cloud.html',
						controller: 'CloudCtrl'
					}
				}
			})

			.state('search', {
				url: '/search',
				templateUrl: 'templates/search.html',
				controller: 'SearchCtrl'
			})

			.state('player', {
				url: '/player',
				templateUrl: 'templates/player.html',
				controller: 'PlayerCtrl'
			});

		// if none of the above states are matched, use this as the fallback
		$urlRouterProvider.otherwise('/tab/songs');

	})

	.config(['$ionicConfigProvider', function ($ionicConfigProvider) {
		$ionicConfigProvider.tabs.position('top');
		$ionicConfigProvider.tabs.style('standard');
		$ionicConfigProvider.spinner.icon('ios');
		$ionicConfigProvider.views.transition('ios');
		$ionicConfigProvider.views.swipeBackEnabled(true);
		$ionicConfigProvider.views.swipeBackHitWidth(60);
		ionic.Platform.isFullScreen = true;

	}]);

function bootstrapAngular() {

	console.log('Bootstrap Angular App');
	var domElement = document.querySelector('body');
	angular.bootstrap(domElement, ['rewind']);

}

document.addEventListener("deviceready", bootstrapAngular, false);