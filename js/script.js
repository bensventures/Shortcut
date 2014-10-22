/**
 *
 */

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
	window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

( function ( win, doc, $ )
{
	'use strict';

	var canvasX = 848,
		canvasY = 480,
		ratingScore,
		imgs,
		review,
		texts = [],
		stage,
		transitionDelay = 8000,
		transitionSpeed = 4, //seconds
		deferreds = [],
		steps = [],
		textsCache = [],
		programName,
		interval;

	/**
	 * The animation of a layer. Uses Tween from KinecticJS
	 * @param element
	 * @param callback
	 */
	function tween ( element, callback )
	{
		var tween = new Kinetic.Tween( {
			node : element.node,
			duration : transitionSpeed,
			easing: Kinetic.Easings.BackEaseOut,
			x : 0,
			y : 0,
			opacity : 1,
			onFinish : callback
		} );

		textsCache.forEach( function ( element )
		{
			element.layer.moveToTop();
		} );

		tween.play();
	}

	/**
	 * Mix text layers and image groups.
	 * On Text is inserted every two images
	 */
	function insertText ()
	{
		steps.forEach( function ( node, index )
		{
			if ( index % 2 )
			{
				var text = texts.shift();

				if ( text )
				{
					textsCache.push( text );

					steps.splice( index, 0, text );
				}
			}
		} );
	}

	/**
	 * Each time the function is called we take a layer from the stack and start its animation
	 * When everything has been animated we stop the interval and launch a call back to PhantomJS
	 */
	function loopAnimation()
	{
		var element = steps.shift(),
			textTweenCallback = function ()
			{
				var tween = new Kinetic.Tween( {
					node : element.node,
					duration : transitionSpeed,
					opacity : 0
				} );

				tween.play();
			};

		if ( element )
		{
			if( element.node.nodeType === "Group" )
			{
				tween( element, function () {
					setTimeout( textTweenCallback, transitionDelay/2 );
				} );
			}
			else
			{
				tween( element, function (){} );
			}
		}
		else
		{
			clearInterval( interval );
			if ( typeof window.callPhantom === 'function' ) {
				var status = window.callPhantom();
			}

		}
	}

	/**
	 * Started when all the data has been retrieved from the APIs
	 * Create the different layers to animate later
	 * Start the first animation after 2 seconds
	 */
	function init ()
	{
		console.log( 'init' );

		createImagesLayers();
		createTextLayers();

		$.when.apply( $, deferreds ).done( function ()
		{
			console.log( 'all ready' );

			insertText();

			setTimeout( loopAnimation, 2000 );

			interval = setInterval( function ()
			{
				loopAnimation();
			}, transitionDelay );

		} );
	}

	/**
	 * Start the app on dom ready. Get the program id if existent and grab the data
	 */
	$( doc ).ready( function ()
	{
		stage = new Kinetic.Stage( {
			container : 'container',
			width : canvasX,
			height : canvasY
		} );

		if ( window.location.hash.length )
		{
			getVideo( window.location.hash.replace( '#', '' ) );
		}
	} );

	/**
	 * Retrieve all the images and data from the various APIs
	 * Save the images in a folder for later use in the animation
	 * TODO: Stop saving images on the server, this is not needed anymore because we use PhantomJS to do screenshots
	 * instead of Canvas.toDataUrl
	 * @param programId
	 */
	function getVideo ( programId )
	{
		$.get( 'http://api.softonic.com/en/programs/' + programId + '.json?key=c8f8e8dc13aebc4717b4275eed065aec', function ( dataProgram )
		{
			if ( dataProgram )
			{
				programName = dataProgram.title;
				ratingScore = dataProgram.rating_softonic;

				$.ajax( {
					type : 'POST',
					data : { url : dataProgram._links.screenshots.href + '?key=c8f8e8dc13aebc4717b4275eed065aec' },
					url : 'http://localhost:3000/get',
					success : function ( dataImages )
					{
						imgs = JSON.parse( dataImages );

						$.get( 'http://api.softonic.com/en/programs/' + programId + '/review.json?key=c8f8e8dc13aebc4717b4275eed065aec', function ( dataReview )
						{
							review = dataReview;
							init();
						} );
					}
				} );
			}
		} );
	}

	// Create layers containing text
	function createTextLayers ()
	{
		var titleLayer = new Kinetic.Layer(),
			title = new Kinetic.Text( {
				x : 0,
				y : 50,
				fontSize : 30,
				fill : 'black',
				text : review.title,
				padding : 20
			} ),
			rec = new Kinetic.Rect( {
				x : 0,
				y : 50,
				width : title.getWidth(),
				height : title.getHeight(),
				fill : 'white'
			} ),
			groupTitle = new Kinetic.Group( {
				x : -canvasX
			} ),
		// Program name
			nameLayer = new Kinetic.Layer(),
			name = new Kinetic.Text( {
				x : 0,
				y : 0,
				fontSize : 30,
				fill : 'black',
				text : programName,
				padding : 20
			} ),
			recName = new Kinetic.Rect( {
				x : 0,
				y : 0,
				width : name.getWidth(),
				height : name.getHeight(),
				fill : 'white'
			} ),
			groupName = new Kinetic.Group( {
				x : -canvasX
			} ),

		// Pros
			prosLayer = new Kinetic.Layer(),
			pros = new Kinetic.Text( {
				x : 0,
				y : stage.height() / 4,
				fontSize : 30,
				fill : 'black',
				text : 'Pros: \n •' + review.pros.join( '\n •' ),
				padding : 20
			} ),
			recPros = new Kinetic.Rect( {
				x : 0,
				y : stage.height() / 4,
				width : pros.getWidth(),
				height : pros.getHeight(),
				fill : 'white'
			} ),
			groupPros = new Kinetic.Group( {
				x : -canvasX
			} ),

		// Cons
			consLayer = new Kinetic.Layer(),
			cons = new Kinetic.Text( {
				x : 0,
				y : stage.height() / 4,
				fontSize : 30,
				fill : 'black',
				text : 'Cons: \n •' + review.cons.join( '\n •' ),
				padding : 20
			} ),
			recCons = new Kinetic.Rect( {
				x : 0,
				y : stage.height() / 4,
				width : cons.getWidth(),
				height : cons.getHeight(),
				fill : 'white'
			} ),
			groupCons = new Kinetic.Group( {
				x : -canvasX
			} ),

		// Rating
			ratingLayer = new Kinetic.Layer(),
			rating = new Kinetic.Text( {
				x : 0,
				y : 400,
				fontSize : 30,
				fill : 'black',
				text : 'Rating: \n' + ratingScore + '/10',
				padding : 20
			} ),
			recRating = new Kinetic.Rect( {
				x : 0,
				y : 400,
				width : rating.getWidth(),
				height : rating.getHeight(),
				fill : 'white'
			} ),
			groupRating = new Kinetic.Group( {
				x : -canvasX
			} ),

			deferred = $.Deferred();

		deferreds.push( deferred );

		groupTitle.add( rec );
		groupTitle.add( title );
		titleLayer.add( groupTitle );
		stage.add( titleLayer );

		groupName.add( recName );
		groupName.add( name );
		nameLayer.add( groupName );
		stage.add( nameLayer );

		groupPros.add( recPros );
		groupPros.add( pros );
		prosLayer.add( groupPros );
		stage.add( prosLayer );

		groupCons.add( recCons );
		groupCons.add( cons );
		consLayer.add( groupCons );
		stage.add( consLayer );

		groupRating.add( recRating );
		groupRating.add( rating );
		ratingLayer.add( groupRating );
		stage.add( ratingLayer );

		texts.push( { 'layer' : nameLayer, 'node' : groupName } );
		texts.push( { 'layer' : titleLayer, 'node' : groupTitle } );
		texts.push( { 'layer' : prosLayer, 'node' : groupPros } );
		texts.push( { 'layer' : consLayer, 'node' : groupCons } );
		texts.push( { 'layer' : ratingLayer, 'node' : groupRating } );

		deferred.resolve();
	}

	/**
	 * Create a layer for each image in the json
	 */
	function createImagesLayers ()
	{
		imgs.forEach( function ( img )
		{
			var layer = new Kinetic.Layer(),
				imageObj = new Image(),
				deferred = $.Deferred();

			deferreds.push( deferred );

			imageObj.onload = function ()
			{
				var currentImage = new Kinetic.Image( {
					x : -img.width,
					y : 0,
					image : imageObj,
					width : img.width,
					height : img.height
				} );

				// add the shape to the layer
				layer.add( currentImage );

				// add the layer to the stage
				stage.add( layer );

				steps.push( { 'layer' : layer, 'node' : currentImage } );

				deferred.resolve();
			};

			imageObj.onerror = function ()
			{
				deferred.resolve();
			};

			imageObj.src = img.url;
		} );
	}

} ( window, document, jQuery )	);
