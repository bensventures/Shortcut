var http = require( "http" );
var fs = require( 'fs' );
var express = require( 'express' );
var server = express(); // better instead
var exec = require( 'child_process' ).exec;

var programId = process.argv[2] || 77717;
var grabInterval;

server.configure( function ()
{
	server.use( express.bodyParser() );

	server.post( "/get", function ( req, response )
	{
		var url = req.body.url;

		console.log( url );

		http.get( url,function ( res )
		{
			var body = '';

			res.on( 'data', function ( chunk )
			{
				body += chunk;
			} );

			res.on( 'end', function ()
			{
				var images = JSON.parse( body );

				saveImages( images._embedded.screenshot, function ( savedImages )
				{
					response.send( savedImages );
				} );

			} );
		} ).on( 'error', function ( e )
			{
				console.log( "Got error: ", e );
			} );

	} );

	server.use( '/js', express.static( __dirname + '/js' ) );
	server.use( express.static( __dirname + '/public' ) );
} );

var phantom = require( 'node-phantom' );
phantom.create( function ( err, ph )
{
	var frame = 0;

	if( err ) console.log( err );

	ph.createPage( function ( error, page )
	{
		if( error ) console.log( error );

		page.viewportSize = { width : 848, height : 480 };

		page.onError = function ( msg, trace )
		{
			console.log( msg );
			trace.forEach( function ( item )
			{
				console.log( '  ', item.file, ':', item.line );
			} )
		};

		page.onCallback = function ()
		{
			compileVideo();
			page.close();
		};

		page.open( 'http://localhost:3000/#' + programId, function ( err, status )
		{
			console.log( "opened site? ", status );
			grabInterval = setInterval( function ()
			{
				frame++;
				page.render( 'output/screen-' + pad( frame ) + '.jpg' );
			}, 240 )
		} );
	} );
}, { phantomPath : require( 'phantomjs' ).path } );

function compileVideo () {

	clearInterval( grabInterval );

	exec( 'ffmpeg -r 24 -i output/screen-%04d.jpg -vcodec libx264 -s 848x480 output/output.mp4', function ( error, stdout, stderr )
	{
		if ( stdout !== '' )
		{
			console.log( '---------stdout: ---------\n' + stdout );
		}
		if ( stderr !== '' )
		{
			console.log( '---------stderr: ---------\n' + stderr );
		}
		if ( error !== null )
		{
			console.log( '---------exec error: ---------\n[' + error + ']' );
		}
	} );

	console.log( 'Compiled!' );
}

function saveImages ( images, callback )
{
	var imgsSaved = [];

	images.forEach( function ( image, index )
	{
		var path = 'image-' + index + '.jpg';

		var request = http.get( image.full_size, function ( res )
		{
			var imagedata = '';
			res.setEncoding( 'binary' );

			res.on( 'data', function ( chunk )
			{
				imagedata += chunk;
			} );

			res.on( 'end', function ()
			{
				fs.writeFile( 'public/' + path, imagedata, 'binary', function ( err )
				{
					if ( err )
					{
						throw err;
					}
					console.log( 'File saved.' );

					imgsSaved.push( { url : path, width : image.full_size_width, height : image.full_size_height } );

					if ( index === images.length - 1 )
					{
						callback( JSON.stringify( imgsSaved ) );
					}

				} );

			} );

		} );
	} );
}

// Pad to follow the processing export format
function pad ( num )
{
	var s = "000" + num;
	return s.substr( s.length - 4 );
}

server.listen( 3000 );