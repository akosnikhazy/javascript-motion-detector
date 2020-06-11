/*
* Created by Ákos Nikházy
*
* This thing was ment to work with web cameras, but I used it
* with mjpg cameras those use simple image tag for image. 
* I have no right to release that version, but it is easy
* to modify this to work like that.
*
* In HTML You need a camera feed and 3 canvases with the IDs:
* newPhoto,oldPhoto,savePhoto
*/

function hasGetUserMedia()
{
	// returns true if supported
	return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

function onSuccess(stream)
{
	// If we can stream from camera.
	var source;

	// Get the stream. This goes to the video tag
	if (window.URL)
	{
		source = window.URL.createObjectURL(stream);
	} 
	else
	{
		source = stream; //  Opera and Firefox
	}

	// Set up video tag
	video.autoplay = true;
	video.src = source;
	  
	// We try to find motion in every X second
	setInterval(function()
	{
		motionDetector();
	}, sampling);

}

function onError()
{
	// if we fail (not supported, no camera etc.)
	alert('No stream, no win. Connect a webcamera or give permission to it and refresh.');
}

function grayScale(context, canvas)
{
	// make canvas gray
	var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
	var pixels  = imgData.data;
	
	for (var i = 0, n = pixels.length; i < n; i += 4) 
	{
		var grayscale = pixels[i] * .3 + pixels[i+1] * .59 + pixels[i+2] * .11;
		pixels[i  ] = grayscale;        //  red
		pixels[i+1] = grayscale;        //  green
		pixels[i+2] = grayscale;        //  blue
	}
	
	// redraw the image in black & white
	context.putImageData(imgData, 0, 0);
}

function colorMeanValue(context, canvas)
{
	// calculate the mean color value of the pixels also we collect all the pixel's colors in array
	var imgData		= context.getImageData(0, 0, canvas.width, canvas.height);
	var pixels  	= imgData.data;
	var colorList 	= new Array();
	var colorSum 	= 0;
	
	for (var i = 0, n = pixels.length; i < n; i += 4) 
	{
		colorList.push(pixels[i+2]);
		colorSum += pixels[i+2];
	}
	
	return [Math.round(colorSum/(sampleDimension*sampleDimension)),colorList];
}

function bits(colorMean)
{
	// represent the the higher than the mean value colors as 1 others as 0
	var bits 	= new Array();
	var colors 	= colorMean[1];
	
	for(var i = 0; i<(sampleDimension*sampleDimension);i++)
	{
		if(colors[i]>=colorMean[0])
		{
			bits[i] = 1;
		}
		else
		{
			bits[i] = 0;
		}
		
	}
	return bits;

}

function hammeringDistance(bits1,bits2){
		// calculating the hammering distance of two set of binary data
		var hD = 0;
		
		console.log(bits1)
		console.log(bits2)
		
		for(i = 0;i<(sampleDimension*sampleDimension);i++)
		{
			if(bits1[i] != bits2[i])
			{
				hD++;
			}
		}
		return hD;
}

function saveImage(canvasToSave)
{
	// create image from canvas
	dataUrl 		= canvasToSave.toDataURL();
	imageFound 		= document.createElement('img');
	imageFound.src 	= dataUrl;
	
	document.body.appendChild(imageFound);
}

function motionDetector()
{
	// this function creates 3 canvas data. The newest image, the newest in savable format and keeps the one before this if needed. This function
	// depends on the first variable as there is no point of comparsion at first iteration.
	
	// we make the three canvases
	ctxOld.drawImage(newPhoto, 0, 0, sampleDimension, sampleDimension);
	ctxNew.drawImage(video, 0, 0, sampleDimension, sampleDimension);
	ctxSave.drawImage(video, 0, 0, savePhoto.width, savePhoto.height);
	
	// convert the newest image to gray scale. There is no need to do this to the second one as it will become this one in the next round
	grayScale(ctxNew, newPhoto);
	
	if(!first)
	{
		// start detecting motion (detecting difference between images 1 second from eachother.
		hD = hammeringDistance
		(
			bits(colorMeanValue(ctxNew, newPhoto)),
			bits(colorMeanValue(ctxOld, oldPhoto))
		)
		
		console.log(hD);
		
		if(hD > sensitivity)
		{
			saveImage(savePhoto);
		}
		
		
	} else {first=false;}
	
   
	
  
}

/*After all those functions lets start setting up the program*/

// Set up elements. Should be a ini() but I don't care right now
var video 			= document.querySelector('video');		// the video tag
var newPhoto 		= document.getElementById('newPhoto');	// the newest image's canvas
var oldPhoto 		= document.getElementById('oldPhoto');	// the older image's canvas
var savePhoto 		= document.getElementById('savePhoto');	// the possible saved image's canvas
															   
var ctxNew 			= newPhoto.getContext('2d');			// the latest image from video prepared for comparison
var ctxOld 			= oldPhoto.getContext('2d');            // copy of the older image from video prepared for comparison
var ctxSave 		= savePhoto.getContext('2d');           // the latest image from video in full size and color
															   
var sampling		= 1000;									// how much time needed between samples in milliseconds
															   
var sensitivity		= 10;									// how sensitive the detection. 1 is the minimum 5 is ideal, more might be good at worst cameras where noise is present even when there is no movement
															   
var first 			= true;									// true if it was the first iteration of the code
															   
var sampleDimension	= 8; 									// size of the samples. Small square image based on camera stream. The bigger the more resource it needs. 8 works perfectly.

// We need this so we can use the videoWidth and ...Height, also we setup canvas sizes here, after we have video data
video.addEventListener("loadedmetadata", function(){
	console.log(video.videoWidth+":"+video.videoHeight)
	oldPhoto.width = oldPhoto.height = newPhoto.width = newPhoto.height = sampleDimension;
	savePhoto.width = video.videoWidth;
	savePhoto.height = video.videoHeight;
});

// Start the whole magic
if (hasGetUserMedia())
{
	// it is working?
	navigator.getUserMedia || (navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia);
	navigator.getUserMedia({video: true, toString : function() {return "video";}}, onSuccess, onError);
} 
else
{
	// no support
	alert('getUserMedia() is not supported in your browser. Try Chrome.');
}
