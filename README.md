# VanillaJS 2D Physics Engine v0.2.1

This repository is a VanillaJS-based 2d physics engine that simulates elastic collisions between circular bodies. The engine utilizes an HTML canvas to render the graphics, with JS regulating the size, position, and velocity of the bodies.

A new circular body can be added by clicking and dragging on an empty area of the canvas.

An existing circular body can have velocity imparted upon it by clicking and dragging; the magnitude of the imparted velocity will be proportional to the distance between the circle's center and the pointer, and the direction of the velocity will be coincident with the vector spanning from the pointer to the circle's center.

MAJOR BUGS:
Some collisions are "sticky" and act in a physically nonsensical manner - it appears this occurs when circles overlap.
  * This may be due to the engine's current method for changing object position; collisions are only checked for after the object has finished moving between frames, so true collisions (i.e. bodies only meet at one point) are hard to catch.