Shortcut
========

Experimental Short videos with Node and Canvas. The idea was to automatically create videos from a list of images, slideshow type.
Images came from an API, a Node server would get them, fire PhantomJS, load a page where an animation was defined and grab all the frame of the animation.
Then, calling ffmpeg, we stich everything together in a .mp4 file. 

It kind of works. Performance is not there yet and the code is ugly but as a prototype it was enough.
