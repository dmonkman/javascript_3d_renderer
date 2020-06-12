class Renderer {
	constructor(ctx, canWidth, canHeight, pos, dir){
		this.ctx = ctx;
		this.pos = new Vector3D(pos[0], pos[1], pos[2]);
		this.dir = new Vector3D(dir[0], dir[1], dir[2]);
		this.FOV = Math.PI/2;
		this.screenWidth = canWidth;
		this.screenHeight = canHeight;
		this.aspectRatio = canWidth/canHeight;
		this.invTanFOV = 1/Math.tan(this.FOV/2);
		this.triangleQueue = [];
		this.renderQueue = [];
		this.ctx.fillStyle = "#FFFFFF";
	}
	pointTransform(Point) {
		var line = Point.sub(this.pos);		// Find the vector from camera to point
		var depth = line.length();				// Find the absolute distance from camera to point
		var cosTheta = this.dir.dotProduct(line)/(this.dir.length()*depth);
		var t = 1/(this.dir.dotProduct(line));		// t is the parameter value of the line when interstecting the plane of the canvas
		var drawPos = line.rotate(-Math.atan2(this.dir.x, this.dir.z), new Axis(0, 0, 0, 0, 1, 0));
		drawPos = drawPos.scale(t);
		drawPos.x = this.screenWidth*(this.invTanFOV*drawPos.x + 0.5);
		drawPos.y = this.screenHeight*(0.5 - this.invTanFOV*drawPos.y);
		drawPos.z = depth;
		return drawPos;
	}
	drawLine(VertexA, VertexB) {
		var lineA = VertexA.sub(this.pos);
		var depthA = lineA.length();
		var cosTheta = this.dir.dotProduct(lineA)/(this.dir.length()*depthA);
		var tA = 1/(this.dir.dotProduct(lineA));		// t is the parameter value of the line when interstecting the plane of the canvas
		var drawPosA = lineA.rotate(-Math.atan2(this.dir.x, this.dir.z), new Axis(0, 0, 0, 0, 1, 0));
		drawPosA = drawPosA.scale(tA);
		drawPosA.x = this.screenWidth*(this.invTanFOV*drawPosA.x + 0.5);
		drawPosA.y = this.screenHeight*(0.5 - this.invTanFOV*drawPosA.y);
		drawPosA.z = depthA*cosTheta/this.invTanFOV;
		
		var lineB = VertexB.sub(this.pos);
		var depthB = lineB.length();
		cosTheta = this.dir.dotProduct(lineB)/(this.dir.length()*depthB);
		var tB = 1/(this.dir.dotProduct(lineB));		// t is the parameter value of the line when interstecting the plane of the canvas
		var drawPosB = lineB.rotate(-Math.atan2(this.dir.x, this.dir.z), new Axis(0, 0, 0, 0, 1, 0));
		drawPosB = drawPosB.scale(tB);
		drawPosB.x = this.screenWidth*(this.invTanFOV*drawPosB.x + 0.5);
		drawPosB.y = this.screenHeight*(0.5 - this.invTanFOV*drawPosB.y);
		drawPosB.z = depthB*cosTheta/this.invTanFOV;

		if(tA>0 && tB>0){
			this.ctx.beginPath();
			this.ctx.moveTo(drawPosA.x, drawPosA.y);
			this.ctx.lineTo(drawPosB.x, drawPosB.y);
			this.ctx.stroke();
		}
	}
	drawTriangle(Tri) {
		var sPoint0 = Tri.vert[0];
		var line = sPoint0.sub(this.pos);		// Find the vector from camera to point
		if(line.dotProduct(Tri.normal)>=0)
			return;
		sPoint0 = this.pointTransform(Tri.vert[0]);
		var sPoint1 = this.pointTransform(Tri.vert[1]);
		var sPoint2 = this.pointTransform(Tri.vert[2]);
		this.ctx.beginPath();
		this.ctx.moveTo(sPoint0.x, sPoint0.y);
		this.ctx.lineTo(sPoint1.x, sPoint1.y);
		this.ctx.lineTo(sPoint2.x, sPoint2.y);
		this.ctx.lineTo(sPoint0.x, sPoint0.y);
		this.ctx.stroke();
	}
	handleTriangle(Tri){
		var line = Tri.vert[0].sub(this.pos);		// Find the vector from camera to point
		if(line.dotProduct(Tri.normal)>=0)
			return 0;
		var Tri2D = new Triangle();
		Tri2D.vert[0] = this.pointTransform(Tri.vert[0]);
		Tri2D.vert[1] = this.pointTransform(Tri.vert[1]);
		Tri2D.vert[2] = this.pointTransform(Tri.vert[2]);
		if(Tri2D.vert[0].z  > Tri2D.vert[1].z){
			Tri2D.vert[0].z = Tri2D.vert[1].z ;
		}
		if(Tri2D.vert[0].z  > Tri2D.vert[2].z){
			Tri2D.vert[0].z = Tri2D.vert[2].z ;
		}
		if(this.triangleQueue.length == 0){
			this.triangleQueue.push(Tri2D);
			return 0;
		}
		else{
			for(var i = 0; i < this.triangleQueue.length; i++){
				if(Tri2D.vert[0].z > this.triangleQueue[i].vert[0].z ){
					this.triangleQueue.splice(i, 0, Tri2D);
					return 0;
				}
			}
			this.triangleQueue.push(Tri2D);
			return 0;
		}
	}
	fillTriangle(Tri) {
		var grd = this.ctx.createLinearGradient(Tri.vert[0].x, Tri.vert[0].y, Tri.vert[1].x, Tri.vert[1].y);
		grd.addColorStop(0, "red");
		grd.addColorStop(1, "white");
		this.ctx.fillStyle = grd;
		this.ctx.beginPath();
		this.ctx.moveTo(Tri.vert[0].x, Tri.vert[0].y);
		this.ctx.lineTo(Tri.vert[1].x, Tri.vert[1].y);
		this.ctx.lineTo(Tri.vert[2].x, Tri.vert[2].y);
		this.ctx.fill();
		this.ctx.fillStyle = "#FFFFFF";
	}
	renderMesh(mesh){
		/*grd.addColorStop(0, "red");
		grd.addColorStop(1, "white");
		this.ctx.fillStyle = grd;
		for(var i = 0; i < mesh.faces.length-1; i++){
	
			this.handleTriangle(new Triangle(mesh.vertices[mesh.faces[i][0]].x, mesh.vertices[mesh.faces[i][0]].y, mesh.vertices[mesh.faces[i][0]].z,
											mesh.vertices[mesh.faces[i][1]].x, mesh.vertices[mesh.faces[i][1]].y, mesh.vertices[mesh.faces[i][1]].z,
											mesh.vertices[mesh.faces[i][2]].x, mesh.vertices[mesh.faces[i][2]].y, mesh.vertices[mesh.faces[i][2]].z));

		}*/
		var p1 = 0;
		var p2 = 0;
		var p3 = 0;
		var draws = 0;
		for(var i = 0; i < mesh.faces.length-1; i++){
			p1 = mesh.vertices[mesh.faces[i][0]];
			p2 = mesh.vertices[mesh.faces[i][1]];
			p3 = mesh.vertices[mesh.faces[i][2]];
			var line = p1.sub(this.pos);
			//if(line.length()>0 && this.renderQueue.length < 1000){
				var cosNormal = line.dotProduct((p2.sub(p1)).crossProduct(p3.sub(p1)));
				p1 = this.pointTransform(p1);
				p2 = this.pointTransform(p2);
				p3 = this.pointTransform(p3);
				var Tri2D = new Triangle2D(p1.integerize(), p2.integerize(), p3.integerize(), cosNormal)
				this.renderQueue.push(Tri2D);
			//}
		}
	}
	renderTriangles2D(){
		var draws = 0;
		while(this.renderQueue.length > 0){
			if(this.renderQueue[0].pclose.z > this.renderQueue[this.renderQueue.length-1].pclose.z){
				var tri = this.renderQueue.shift();
			}
			else
				var tri = this.renderQueue.pop();
			//if(tri.cosNormal > 0)
			this.ctx.fillStyle = "rgba(" + 255*tri.cosNormal + ", " + 255*tri.cosNormal + ", " + 255*tri.cosNormal + ", 1)";
			this.ctx.strokeStyle = "rgba(" + 255*tri.cosNormal + ", " + 255*tri.cosNormal + ", " + 255*tri.cosNormal + ", 1)";
			//else	
				//grd.addColorStop(0, "rgba(0, 0, 0, 1)");
			//if(tri.pfar.z != 0)
				//grd.addColorStop(1, "rgba(" + 1000/tri.pfar.z + ", " + 1000/tri.pfar.z + ", " + 1000/tri.pfar.z + ", 1)");
			//else	
				//grd.addColorStop(0, "rgba(0, 0, 0, 1)");
			//this.ctx.fillStyle = grd;
			this.ctx.beginPath();
			this.ctx.lineWidth = 2;
			this.ctx.moveTo(tri.pclose.x, tri.pclose.y);
			this.ctx.lineTo(tri.pmed.x, tri.pmed.y);
			this.ctx.lineTo(tri.pfar.x, tri.pfar.y);
			this.ctx.lineTo(tri.pclose.x, tri.pclose.y);
			this.ctx.stroke();
			this.ctx.fill();
			this.ctx.fillRect(tri.pclose.x, tri.pclose.y, 2, 2);
			draws++;
		}
		this.ctx.fillStyle = "#FFFFFF";
		this.ctx.fillText(draws, 10, 230);
	}
	
	renderTriangles(){
		var draws = 0;
		while(this.triangleQueue.length > 0){
			//if(this.triangleQueue[0].z > this.triangleQueue[this.triangleQueue.length -1].z){
			//	this.fillTriangle(this.triangleQueue.shift());
			//}
			//else{
				this.fillTriangle(this.triangleQueue.shift());
				draws++;
			//}
		}
		this.ctx.fillText(draws, 10, 220);
	}
	
}