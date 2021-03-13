# 3D Rendering Engine by Drayton Monkman

Updated: March 13, 2021

## About

This is a basic 3D renderer and rasterizer developed from scratch using only HTML canvas and Javacript + JQuery. It can parse .obj files as used in blender if conformed to the template found in teapot.obj.js. The camera can be moved using the controls listed below.

## Controls

- Movement:
    - w, a ,s, d keys to move the camera
- Rotation:
    - 1, 2 keys to control yaw (rotate the camera about it's up axis)
    - q, e keys to control roll (rotate the camera about it's forward axis)
    - r, f keys to control pitch (rotate the camera about it's right axis)
- Misc:
    - 3, 4 keys change the field of view 
    - 5, 6 keys to disable, enable wireframe meshes respectively
    - z key to reset the camera direction to (0,0,1), ie. the positive z axis

## Thanks

Some of the code used is inspired or ported from OneLineCoder's 3D engine using C++, the source code of which can be found [here](https://github.com/OneLoneCoder/videos/blob/master/OneLoneCoder_olcEngine3D_Part3.cpp). He provides a good explaination the the steps required to build a 3D renderer and the thinking behind it. A key difference between our implementations is that he uses matrices to calculate rotations and positions. I opted to use quaternion rotation to allow for more freedom when rotating the camera. It also makes it easier to implement aircraft / flight based games programs where the camera is constantly rotating about axes in different orientations.