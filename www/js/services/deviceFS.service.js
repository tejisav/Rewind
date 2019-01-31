// Scan recursively a provided local directory and look for music (mp3 and m4a) music files
angular.module('rewind.services').factory("deviceFS", function($q,rewindDB,ID3Tags,rewindConfig,$cordovaToast,$cordovaFile,stringProcessing) {

    var deviceFSService = {

        // Scan entry from local filesystem
        handleItem : function(entry,results){
            var extensionsAudio=rewindConfig.extensionsAudio;
            var self=this;
            var hDeferred=$q.defer();

            // Audio file
            if (entry.isFile) {
                var fileName = entry.name;
                var extension=fileName.substr(fileName.lastIndexOf('.')+1);
                console.log('exploring '+fileName+', ext : ' + extension);
                if (extensionsAudio.indexOf(extension.toLowerCase())!=-1){
                    rewindDB.isInDatabase(entry.nativeURL).then(function(res){
                        if (res){
                            hDeferred.resolve();
                        } else {
                            results.push(entry.nativeURL);
                            hDeferred.resolve();
                        }
                    });
                } else {
                    hDeferred.resolve();
                }
            }
            //Directory
            if (entry.isDirectory){
                self.scanDirectory(entry.nativeURL,results).then(function(res){
                    hDeferred.resolve();
                });
            }
            return hDeferred.promise;
        },
        scanDirectory: function(path,results){
            var self=this;
            var d= $q.defer();
            var promises = [];

            window.resolveLocalFileSystemURL(path, function(fileSystem) {
                var directoryReader = fileSystem.createReader();

                directoryReader.readEntries(function(entries) {

                    for (var index=0;index<entries.length;index++){
                        promises.push(self.handleItem(entries[index],results));
                    }
                    var sz=promises.length;
                    $q.all(promises).then(function(res){
                        d.resolve();
                    });
                },function(err){
                    console.log('Read entries error');
                    console.dir(err);
                    d.resolve();
                });
            });
            return d.promise;
        },

        // Start to scan 'path', find music files, extract ID3 tags and add them to database
        scanMusicFolder: function(path){
            var d=$q.defer();
            var results=[];
            // show ionic loading

            $cordovaToast.showShortTop('Start to scan the directory');
            this.scanDirectory(path,results).then(function(res){
                console.log('DONE SCAN');

                $cordovaToast.showShortTop('Find '+results.length+' music files to add !');
                return ID3Tags.readTagsFromFileList(results);
            }).then(function(tagList){
                $cordovaToast.showShortTop('ID3 Tags Loaded !');
                stringProcessing.formatAllTitles(tagList);
                console.log('Formatted');
                return rewindDB.addTitleList(tagList);
            }).then(function(){
                $cordovaToast.showShortTop('Database Ready !');
                console.log('DATABASE READY');

                d.resolve();
            });

            // end ionic loading
            
            return d.promise;
        }

    };

    return deviceFSService;

});


