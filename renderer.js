class Camera {
	constructor(ctx, canWidth, canHeight, position, direction, up){
		this.ctx = ctx;
		this.screenWidth = canWidth;
		this.screenHeight = canHeight;

		this.position = new Vector3D(position[0], position[1], position[2]);
		this.direction = new Vector3D(direction[0], direction[1], direction[2]);
		this.up = new Vector3D(up[0], up[1], up[2]);
		this.right = Vector_CrossProduct(this.up, this.direction)
		this.printTris = false;
		this.rotation = new Quaternion(1, 0, 0, 0)

		this.FOV = Math.PI/2;
		this.midpoints = []

		this.aspectRatio = canWidth/canHeight;
		this.invTanFOV = 1/Math.tan(this.FOV/2);
		this.triangleQueue = [];
		this.renderQueue = [];
		this.ctx.fillStyle = "#FFFFFF";
		this.DEBUG = false;
	}
	Update(){

	}

	// Rotate the camera about it's up axis
	yaw(angleRads){
		this.direction.normalize();
		var sinAngle = Math.sin(angleRads/2);

		// Define a quaterion to rotate 'angleRads' about the this.up vector
		var Q = new Quaternion(Math.cos(angleRads/2), sinAngle*this.up.x, sinAngle*this.up.y, sinAngle*this.up.z);
		var Qconj = Q.Qconjugate();

		// Cumulate the rotation
		this.rotation.Qmul(Qconj)

		// Perform the rotation
		var Qconj = Q.Qconjugate();
		var Q1 = Quaternion_Mul_V(Q, this.direction);
		Q = Quaternion_Mul_Q(Q1, Qconj);
		Q.normalize()
		this.direction.x = Q.x;
		this.direction.y = Q.y;
		this.direction.z = Q.z;

		// Update the right vector
		this.right = Vector_CrossProduct(this.up, this.direction)
	}

	// Roll the camera about it's forward directional axis
	roll(angleRads){
		this.up.normalize();
		var sinAngle = Math.sin(angleRads/2);

		// Define a quaterion to rotate 'angleRads' about the this.direction vector
		var Q = new Quaternion(Math.cos(angleRads/2), sinAngle*this.direction.x, sinAngle*this.direction.y, sinAngle*this.direction.z);
		var Qconj = Q.Qconjugate();

		// Cumulate the rotation
		this.rotation.Qmul(Qconj)

		// Perform the rotation
		var Q1 = Quaternion_Mul_V(Q, this.up);
		Q = Quaternion_Mul_Q(Q1, Qconj);
		Q.normalize()
		this.up.x = Q.x;
		this.up.y = Q.y;
		this.up.z = Q.z;

		// Update the right vector
		this.right = Vector_CrossProduct(this.up, this.direction)
	}

	// Pitch the camera up about it's right axis
	pitch(angleRads){
		this.direction.normalize();
		var sinAngle = Math.sin(angleRads/2);

		// Define a quaterion to rotate 'angleRads' about the this.up vector
		var Q = new Quaternion(Math.cos(angleRads/2), sinAngle*this.right.x, sinAngle*this.right.y, sinAngle*this.right.z);
		var Qconj = Q.Qconjugate();

		// Cumulate the rotation
		this.rotation.Qmul(Qconj)

		// Perform the rotation
		var Qconj = Q.Qconjugate();
		var Q1 = Quaternion_Mul_V(Q, this.direction);
		Q = Quaternion_Mul_Q(Q1, Qconj);
		Q.normalize()
		this.direction.x = Q.x;
		this.direction.y = Q.y;
		this.direction.z = Q.z;

		// Update the up vector
		this.up = Vector_CrossProduct(this.direction, this.right)
	}

	Triangle_WorldTransform(tri){
		// Move and rotate the triangle relative to the camera

		// 1. TRANSFORM THE TRIANGLE RELATIVE TO THE CAMERA POSITION
		var pTranslated = new Array()
		pTranslated[0] = tri.vert[0].sub(this.position);		// Find the vector from camera to point
		pTranslated[1] = tri.vert[1].sub(this.position);		// Find the vector from camera to point
		pTranslated[2] = tri.vert[2].sub(this.position);		// Find the vector from camera to point

		// 2. ROTATE WORLD OBJECTS TO THE CORRECT ORIENTATION ABOUT THE CAMERA

		// Qrot is the inverse of all total multiplicative camera rotations
		var Qrot = this.rotation
		var Qconj = Qrot.Qconjugate()

		// To rotate point p using rotation quaternion q: 
			// p' = q * p * qconj
		var pTransformed = new Array()
		pTransformed[0] = Quaternion_Mul_Q_V(Quaternion_Mul_V(Qrot, pTranslated[0]), Qconj);
		pTransformed[1] = Quaternion_Mul_Q_V(Quaternion_Mul_V(Qrot, pTranslated[1]), Qconj);
		pTransformed[2] = Quaternion_Mul_Q_V(Quaternion_Mul_V(Qrot, pTranslated[2]), Qconj);

		var out_tri = new Triangle()
		out_tri.vert[0] = pTransformed[0];
		out_tri.vert[1] = pTransformed[1];
		out_tri.vert[2] = pTransformed[2];
		out_tri.color = tri.color;

		return out_tri;
	}

	Triangle_ClipAgainstPlane(plane_p, plane_n, in_tri)
	{
		var plane_n = Vector_Normalize(plane_n);

		// Create two temporary storage arrays to classify points either side of plane
		// If distance sign is positive, point lies on "inside" of plane
		var inside_points = [];  var nInsidePointCount = 0;
		var outside_points = []; var nOutsidePointCount = 0;

		// Return signed shortest distance from point to plane, plane normal must be normalized
		function dist(p)
		{
			n = new Vector3D()
			var n = Vector_Normalize(p);
			return (plane_n.x * p.x + plane_n.y * p.y + plane_n.z * p.z - Vector_DotProduct(plane_n, plane_p));
		};

		// Get signed distance of each point in triangle to plane
		var d0 = dist(in_tri.vert[0]);
		var d1 = dist(in_tri.vert[1]);
		var d2 = dist(in_tri.vert[2]);

		if (d0 >= 0) { inside_points[nInsidePointCount++] = in_tri.vert[0]; }
		else { outside_points[nOutsidePointCount++] = in_tri.vert[0]; }
		if (d1 >= 0) { inside_points[nInsidePointCount++] = in_tri.vert[1]; }
		else { outside_points[nOutsidePointCount++] = in_tri.vert[1]; }
		if (d2 >= 0) { inside_points[nInsidePointCount++] = in_tri.vert[2]; }
		else { outside_points[nOutsidePointCount++] = in_tri.vert[2]; }

		// Now classify triangle points, and break the input triangle into 
		// smaller output triangles if required. There are four possible
		// outcomes...

		var out_tri = []
		out_tri[0] = new Triangle()

		if (nInsidePointCount == 0)
		{
			// All points lie on the outside of plane, so clip whole triangle

			return 0; // No returned triangles are valid
		}

		if (nInsidePointCount == 3)
		{
			// All points lie on the inside of plane, so allow the triangle to pass

			return 1; // Just the one returned original triangle is valid
		}

		if (nInsidePointCount == 1 && nOutsidePointCount == 2)
		{
			// Triangle should be clipped. As two points lie outside
			// the plane, the triangle becomes a smaller triangle

			// Copy appearance info to new triangle
			out_tri[0].color =  in_tri.color

			// The inside point is valid, so keep that...
			out_tri[0].vert[0] = inside_points[0];

			// but the two new points are at the locations where the 
			// original sides of the triangle (lines) intersect with the plane
			out_tri[0].vert[1] = Vector_IntersectPlane(plane_p, plane_n, inside_points[0], outside_points[0]);
			out_tri[0].vert[2] = Vector_IntersectPlane(plane_p, plane_n, inside_points[0], outside_points[1]);

			return out_tri; // Return the newly formed single triangle
		}

		if (nInsidePointCount == 2 && nOutsidePointCount == 1)
		{
			out_tri[1] = new Triangle()
			// Triangle should be clipped. As two points lie inside the plane,
			// thr triangle will be clipped into two new triangles

			// Copy appearance info to new triangles
			out_tri[0].color =  in_tri.color
			out_tri[1].color =  in_tri.color

			// The first triangle consists of the two inside points and a new
			// point determined by the location where one side of the triangle
			// intersects with the plane
			out_tri[0].vert[0] = inside_points[0];
			out_tri[0].vert[1] = inside_points[1];
			out_tri[0].vert[2] = Vector_IntersectPlane(plane_p, plane_n, inside_points[0], outside_points[0]);

			// The second triangle is composed of one of he inside points, a
			// new point determined by the intersection of the other side of the 
			// triangle and the plane, and the newly created point above
			out_tri[1].vert[0] = inside_points[1];
			out_tri[1].vert[1] = out_tri[0].vert[2];
			out_tri[1].vert[2] = Vector_IntersectPlane(plane_p, plane_n, inside_points[1], outside_points[0]);

			return out_tri; // Return two newly formed triangles which form a quad
		}
	}

	Triangle_ProjectAndQueue(tri){
		var tri_projected = new Triangle()

		// Project the points onto the plane 1 unit in front of the camera
		tri_projected.vert[0] = Vector_IntersectPlane(new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 0.0), tri.vert[0])
		tri_projected.vert[1] = Vector_IntersectPlane(new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 0.0), tri.vert[1])
		tri_projected.vert[2] = Vector_IntersectPlane(new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 0.0), tri.vert[2])

		// Scale and set point depth accordingly
		for (var j = 0; j < 3; j++)
		{
			tri_projected.vert[j].z = (tri.vert[j].sub(tri_projected.vert[j])).length()
			tri_projected.vert[j].x = this.screenWidth*(this.invTanFOV*tri_projected.vert[j].x + 0.5);
			tri_projected.vert[j].y = this.screenHeight*(0.5 - this.invTanFOV*tri_projected.vert[j].y);
		}
	
		// Determine average depth of the triangle
		// This is not perfect, but works 99% of the time
		tri_projected.depth = (tri_projected.vert[0].z + tri_projected.vert[1].z + tri_projected.vert[2].z)/3
		tri_projected.color = tri.color

		// If the queue is empty, simply push
		if (this.triangleQueue.length == 0){
			this.triangleQueue.push(tri_projected);
			return 1;
		}
		
		// If the queue is not empty, sort and push
		else{
			for(var i = 0; i < this.triangleQueue.length; i++){
				if(tri_projected.depth > this.triangleQueue[i].depth){
					this.triangleQueue.splice(i, 0, tri_projected);
					return 1;
				}
			}
			this.triangleQueue.push(tri_projected);
			return 1;
		}
	}

	queueTriangle(tri){
		// Project a 3D triangle into a 2D triangle on the display
		// Find the vector from camera to point
		var line = tri.midpoint.sub(this.position);
		
		// Find the cos between the face normal and the camera vector
		var cosNormal = line.dotProduct(tri.normal);

		// If the triangle is facing away from the camera, ignore the triangle and return
		if(cosNormal>0){
			return 0;
		}
		
		// 1. TRANSFORM THE TRIANGLE IN SPACE RELATIVE TO THE CAMERA
		var tri_transformed = this.Triangle_WorldTransform(tri)


		// 2. CLIP THE TRIANGLE AGAINST THE PLANE OF THE SCREEN
		var tri_clipped = this.Triangle_ClipAgainstPlane(new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 10.0), tri_transformed)
		
		// tri_clipped = [tri_transformed]

		// IF THE TRI IS COMPLETELY OFF SCREEN, IGNORE IT
		if(tri_clipped == 0){
			return 0;
		}

		// 3. PROJECT THE TRIANGLE ONTO THE SCREEN

		// IF THE TRI IS ALREADY VALID, USE THE ORIGINAL TRANSFORMED TRIANGLE
		else if(tri_clipped == 1){
			this.Triangle_ProjectAndQueue(tri_transformed)
		}
		
		else{
			for(var i = 0; i < tri_clipped.length; i++){
				this.Triangle_ProjectAndQueue(tri_clipped[i])
			}
		}
	}


	// Fill all triangles
	fillTriangle(Tri) {
		this.ctx.fillStyle = 'rgb('+
		Math.floor(255*Tri.cosNormal)+','+
		Math.floor(255*Tri.cosNormal)+','+
		Math.floor(255*Tri.cosNormal)+')'
		
		this.ctx.beginPath();
		this.ctx.moveTo(Tri.vert[0].x, Tri.vert[0].y);
		this.ctx.lineTo(Tri.vert[1].x, Tri.vert[1].y);
		this.ctx.lineTo(Tri.vert[2].x, Tri.vert[2].y);

		if(this.DEBUG){
			this.ctx.fillStyle = 'rgba(255,255,0,0.2)'
			this.ctx.strokeStyle = 'rgba(255,255,0,0.5)'
			this.ctx.stroke();
		}
		else{
			this.ctx.fillStyle = Tri.color
				this.ctx.fill();
		}
	}
	
	draw(){
		var draws = 0;
		// Loop through all transformed, viewed, projected, and sorted triangles
		
		// Clip Viewed Triangle against near plane, this could form two additional
		// additional triangles. 
		/*
		var ValidTris = []
		while (this.triangleQueue.length > 0)
		{
			var test = this.triangleQueue.shift()
			var TrisToAdd = this.Triangle_ClipAgainstPlane(new Vector3D(0.0, 0.0, 1.0), new Vector3D(0.0, 0.0, 1.0), test);	

			// 1. IF THE TRI IS COMPLETELY OFF SCREEN, IGNORE IT
			if(TrisToAdd == 0){
				
			}

			//2. IF THE TRI IS VALID, RE ADD IT TO TEST QUEUE
			else if(TrisToAdd == 1){
				ValidTris.push(test);
			}

			//3. IF THE TRI WAS CLIPPED, PUSH THEM
			else{
				if(TrisToAdd.length == 1) 
					ValidTris.push(TrisToAdd[0])
				else {
					ValidTris.push(TrisToAdd[0]); 
					ValidTris.push(TrisToAdd[1])
				}
			}
		}

		this.triangleQueue = ValidTris;*/
		
		while (this.triangleQueue.length > 0)
		{
			// Test the next ready to draw triangle
			var TrisToTest = [this.triangleQueue.shift()]
			for (var p = 0; p < 4; p++){
				if(TrisToTest.length > 0){ 
					var test = TrisToTest.shift()
					// Iterate through the TrisToTest queue and test all triangles against the current and future criteria

					switch (p)
					{
						case 0:	var TrisToAdd = this.Triangle_ClipAgainstPlane(new Vector3D(0.0, 0.0, 0.0), 				new Vector3D( 0.0, 1.0, 0.0 ), test); break;
						case 1:	var TrisToAdd = this.Triangle_ClipAgainstPlane(new Vector3D(0.0, this.screenHeight-1, 0.0 ), 	new Vector3D( 0.0,-1.0, 0.0 ), test); break;
						case 2:	var TrisToAdd = this.Triangle_ClipAgainstPlane(new Vector3D(0.0, 0.0, 0.0 ), 				new Vector3D( 1.0, 0.0, 0.0), test); break;
						case 3:	var TrisToAdd = this.Triangle_ClipAgainstPlane(new Vector3D(this.screenWidth-1, 0.0, 0.0 ), 	new Vector3D(-1.0, 0.0, 0.0 ), test); break;
					}

					// 1. IF THE TRI IS COMPLETELY OFF SCREEN, IGNORE IT
					if(TrisToAdd == 0){
					}

					//2. IF THE TRI IS VALID, RE ADD IT TO TEST QUEUE
					else if(TrisToAdd == 1){
						TrisToTest.push(test);
					}

					//3. IF THE TRI WAS CLIPPED, TEST IT SOME MORE
					else{
						if(TrisToAdd.length == 1) 
							TrisToTest.push(TrisToAdd[0])
						else {
							TrisToTest.push(TrisToAdd[0]); 
							TrisToTest.push(TrisToAdd[1]);
						}
					}
				}
			}

			// Fill all triangles that passed our tests
			while(TrisToTest.length > 0){
				this.fillTriangle(TrisToTest.shift())
				draws++;
			}

		}

		// How many triangles did we draw total?
		this.ctx.fillStyle = '#000000'
		this.ctx.fillText(draws, 10, 220);
		return 0;
	}
}
