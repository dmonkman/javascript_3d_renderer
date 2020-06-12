

class Mesh {
	constructor() {
		this.vertices = [];
		this.faces = [];
	}
}

class Triangle {
	constructor(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
		this.vert = [new Vector3D(x1, y1, z1), new Vector3D(x2, y2, z2), new Vector3D(x3, y3, z3)];
		this.normal = (this.vert[1].sub(this.vert[0])).crossProduct(this.vert[2].sub(this.vert[0]));
	}
	normalize() {
		this.normal = (this.vert[1].sub(this.vert[0])).crossProduct(this.vert[2].sub(this.vert[0]));
	}
}

class Triangle2D {
		constructor(p1, p2, p3, cosNormal){
			this.cosNormal = Math.abs(cosNormal);
			if(p1.z > p2.z){
				if(p1.z > p3.z){
					this.pfar = p1;
					if(p2.z > p3.z){
						this.pmed = p2;
						this.pclose = p3;
					}
					else{
						this.pmed = p3;
						this.pclose= p2;
					}
				}
				else{
					this.pmed = p1;
					this.pfar = p3;
					this.pclose = p2;
				}
			}
			else{
				if(p2.z > p3.z){
					this.pfar = p2;
					if(p1.z > p3.z){
						this.pmed = p1;
						this.pclose = p3;
					}
					else{
						this.pmed = p3;
						this.pclose = p1;
					}
				}
				else{
					this.pfar = p3;
					this.pmed = p2;
					this.pclose = p1;
				}
			}
		}
}

class Cube {
	constructor(x, y, z, size) {
		this.position = new Vector3D(x, y, z);
		this.size = size;
		
		this.mesh = new Mesh();
		
		this.mesh.faces.push(new Triangle(x+0.0, y+0.0, z+0.0,    x+0.0, y+size, z+0.0,    x+size, y+size, z+0.0));
		this.mesh.faces.push(new Triangle(x+0.0, y+0.0, z+0.0,    x+size, y+size, z+0.0,    x+size, y+0.0, z+0.0));
		
		this.mesh.faces.push(new Triangle(x+size, y+0.0, z+0.0,    x+size, y+size, z+0.0,    x+size, y+size, z+size));
		this.mesh.faces.push(new Triangle(x+size, y+0.0, z+0.0,    x+size, y+size, z+size,    x+size, y+0.0, z+size));
		
		this.mesh.faces.push(new Triangle(x+size, y+0.0, z+size,    x+size, y+size, z+size,    x+0.0, y+size, z+size));
		this.mesh.faces.push(new Triangle(x+size, y+0.0, z+size,    x+0.0, y+size, z+size,    x+0.0, y+0.0, z+size));
		
		this.mesh.faces.push(new Triangle(x+0.0, y+0.0, z+size,    x+0.0, y+size, z+size,    x+0.0, y+size, z+0.0));
		this.mesh.faces.push(new Triangle(x+0.0, y+0.0, z+size,    x+0.0, y+size, z+0.0,    x+0.0, y+0.0, z+0.0));
		
		this.mesh.faces.push(new Triangle(x+0.0, y+size, z+0.0,    x+0.0, y+size, z+size,    x+size, y+size, z+size));
		this.mesh.faces.push(new Triangle(x+0.0, y+size, z+0.0,    x+size, y+size, z+size,    x+size, y+size, z+0.0));
		
		this.mesh.faces.push(new Triangle(x+size, y+0.0, z+size,    x+0.0, y+0.0, z+size,    x+0.0, y+0.0, z+0.0));
		this.mesh.faces.push(new Triangle(x+size, y+0.0, z+size,    x+0.0, y+0.0, z+0.0,    x+size, y+0.0, z+0.0));
	} 
	draw(renderer){
		for(var i = 0; i < this.mesh.faces.length; i++){
			renderer.handleTriangle(this.mesh.faces[i]);
			//renderer.fillTriangle(this.mesh.faces[i]);	
		}
	}
	rotate(angle, axis) {
		for(var i = 0; i < this.mesh.faces.length; i++){
			for(var j = 0; j < 3; j++){
				this.mesh.faces[i].vert[j].rotate(angle, new Axis(this.position.x, this.position.y, this.position.z, axis.x, axis.y, axis.z));
				this.mesh.faces[i].normalize();
			}
		}
	}
}

/*
class Vertex {
	constructor(x, y, z){
		this.x = x;
		this.y = y;
		this.z = z;
	}
	addAssign(VectorA){
		this.x += VectorA.x;
		this.y += VectorA.y;
		this.z += VectorA.z;
	}
	add(VectorA){
		return(new Vector3D(this.x+VectorA.x, this.y+VectorA.y, this.z+VectorA.z));
	}
	subAssign(VectorA){
		this.x -= VectorA.x;
		this.y -= VectorA.y;
		this.z -= VectorA.z;
	}
	sub(VectorA){
		return(new Vector3D(this.x-VectorA.x, this.y-VectorA.y, this.z-VectorA.z));
	}
}*/
	