class Circle {
    constructor(id, x, y, radius, fill = false, fillColor = "#000000") {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.fill = fill;
        this.fillColor = fillColor;
        this.mass = Math.pow(this.radius, 2);
        this.v_x = 0;
        this.v_y = 0;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        if (this.fill) {
            ctx.fillStyle = this.fillColor;
            ctx.fill();
        }
        ctx.stroke();
    }
    setVelocity(v_x, v_y) {
        this.v_x = v_x;
        this.v_y = v_y;
    }
    updatePosition() {
        this.x += this.v_x;
        this.y += this.v_y;
    }
}

class PlayArea {
    constructor(element, htmlSize) {
        this.canvas = element;
        this.htmlSize = htmlSize;
        this.cssSize = null;
        this.context = element.getContext("2d");
        this.location = element.getBoundingClientRect();
        this.resizeRatio = null;
        this.circles = [];
        this.resize();
    }
    draw() {
        this.clear();
        this.handleCollisions();
        this.update();
        this.circles.forEach(circle => {
            circle.draw(this.context);
        })
    }
    resize() {
        this.cssSize = 0.98 * Math.min(document.documentElement.clientWidth, document.documentElement.clientHeight);
        this.canvas.style.height = this.cssSize + "px";
        this.canvas.style.width = this.cssSize + "px";
        this.resizeRatio = this.htmlSize / this.cssSize;
        this.location = this.canvas.getBoundingClientRect();
    }
    clear() {
        this.context.clearRect(0, 0, this.htmlSize, this.htmlSize);
    }
    update() {
        this.circles.forEach(circle => {
            if (circle.v_x != 0) {
                circle.x += circle.v_x;
            }
            if (circle.v_y != 0) {
                circle.y += circle.v_y;
            }
        })
    }
    checkForCircleCollisions() {
        const circleCollisions = [];
        this.circles.forEach(circle1 => {
            this.circles.forEach(circle2 => {
                if (circle1.x !== circle2.x && circle1.y !== circle2.y) {
                    if (vectorMagnitude(circle1.x - circle2.x, circle1.y - circle2.y) <= circle1.radius + circle2.radius) {
                        let pairIDs = circle1.id < circle2.id ? [circle1.id, circle2.id] : [circle2.id, circle1.id];
                        let pairExists = false;
                        circleCollisions.forEach(collision => {
                            if (arraysEqual(pairIDs, collision.pair)) {
                                pairExists = true;
                            }
                        })
                        if (!pairExists) {
                            circleCollisions.push({ c1: circle1, c2: circle2, pair: pairIDs })
                        }
                    }
                }
            })
        })
        if (circleCollisions.length > 0) {
            return circleCollisions;
        } else return 0;
    }
    checkForWallCollisions() {
        const wallColisions = []
        this.circles.forEach(circle => {
            const collisions = [];
            if (circle.x <= circle.radius) {
                collisions.push('left');
            }
            if (circle.y <= circle.radius) {
                collisions.push('top');
            }
            if (circle.y >= this.htmlSize - circle.radius) {
                collisions.push('bottom');
            }
            if (circle.x >= this.htmlSize - circle.radius) {
                collisions.push('right');
            }
            if (collisions.length > 0) {
                wallColisions.push({ circle: circle, collisions: collisions });
            }
        })
        if (wallColisions.length > 0) {
            return wallColisions;
        } else return 0;
    }
    handleCollisions() {
        const wallCollisions = this.checkForWallCollisions();
        if (wallCollisions) {
            wallCollisions.forEach(collision => {
                collision.collisions.forEach(wall => {
                    switch (wall) {
                        case 'left':
                            collision.circle.v_x = Math.abs(collision.circle.v_x);
                            break;
                        case 'right':
                            collision.circle.v_x = -1 * Math.abs(collision.circle.v_x);
                            break;
                        case 'top':
                            collision.circle.v_y = Math.abs(collision.circle.v_y);
                            break;
                        case 'bottom':
                            collision.circle.v_y = -1 * Math.abs(collision.circle.v_y);
                            break;
                    }
                })
            })
        }
        const circleCollisions = this.checkForCircleCollisions();
        let memory = [];
        for (let i = 0; i < memory.length; i++) {
            let stillColliding = false;
            circleCollisions.forEach(collision => {
                if (arraysEqual(memory[i].collision.pair, collision.pair)) {
                    stillColliding = true;
                }
            })
            if (!stillColliding) {
                memory.splice(i, 1);
            }
        }
        if (circleCollisions) {
            circleCollisions.forEach(collision => {
                // if collision not in collided, add it, else increment collided count
                let inMemory = false;
                let timedOut = false;
                memory.forEach(item => {
                    if (arraysEqual(item.collision.pair, collision.pair)) {
                        inMemory = true;
                        if (item.collision.count >= 15) {
                            memory.splice(memory.indexOf(item), 1);
                            timedOut = true;
                        } else {
                            memory.collision.count += 1;
                        }
                    }
                });
                if (!inMemory) memory.push({ collision: collision, count: 0 });
                if (!timedOut) {
                    const c1 = collision.c1;
                    const c2 = collision.c2;
                    // Position delta between radii
                    const delta = { x: c2.x - c1.x, y: c2.y - c1.y };
                    // Angle (wrt horizontal) of line between radii c1 -> c2
                    const phi = Math.atan2(delta.y, delta.x);
                    // Direction of c1 velocity (wrt normal coordinates)
                    const theta_v_1 = Math.atan2(c1.v_y, c1.v_x);
                    // Direction of c2 velocity (wrt normal coordinates)
                    const theta_v_2 = Math.atan2(c2.v_y, c2.v_x);
                    const rotation = { v_1: phi - theta_v_1, v_2: phi - theta_v_2 }
                    // v1 vector with respect to line passing through radii (e1 parallel, e2 perpendicular)
                    let v_1_phi = {
                        e1: (c1.v_x * Math.cos(rotation.v_1)) + (c1.v_y * Math.sin(rotation.v_1)),
                        e2: (-c1.v_x * Math.sin(rotation.v_1)) + (c1.v_y * Math.cos(rotation.v_1))
                    };
                    // v2 vector with respect to line passing through radii (e1 parallel, e2 perpendicular)
                    let v_2_phi = {
                        e1: (c2.v_x * Math.cos(rotation.v_2)) + (c2.v_y * Math.sin(rotation.v_2)),
                        e2: (-c2.v_x * Math.sin(rotation.v_2)) + (c2.v_y * Math.cos(rotation.v_2))
                    };
                    // c1 final velocity in phi direction (elastic collision formula 1)
                    const v_1f_phi = (v_1_phi.e1 * (c1.mass - c2.mass) / (c1.mass + c2.mass)) + ((2 * c2.mass * v_2_phi.e1) / (c1.mass + c2.mass));
                    // c2 final velocity in phi direction (elastic collision formula 2)
                    const v_2f_phi = ((2 * c1.mass * v_1_phi.e1) / (c1.mass + c2.mass)) - ((v_2_phi.e1 * (c2.mass - c1.mass)) / (c1.mass + c2.mass));
                    // Assign final velocity values to vectors
                    v_1_phi.e1 = v_1f_phi;
                    v_2_phi.e1 = v_2f_phi;
                    c1.setVelocity(
                        (v_1_phi.e1 * Math.cos(rotation.v_1)) + (-v_1_phi.e2 * Math.sin(rotation.v_1)),
                        (v_1_phi.e1 * Math.sin(rotation.v_1)) + (v_1_phi.e2 * Math.cos(rotation.v_1))
                    );
                    c2.setVelocity(
                        (v_2_phi.e1 * Math.cos(rotation.v_2)) + (-v_2_phi.e2 * Math.sin(rotation.v_2)),
                        (v_2_phi.e1 * Math.sin(rotation.v_2)) + (v_2_phi.e2 * Math.cos(rotation.v_2))
                    );
                }
            })
        }
    }
}

class IntervalHandler {
    constructor(playArea) {
        this.playArea = playArea;
        this.fns = [];
        this.interval = null;
    }
    addFunction(func) {
        this.fns.push(func);
        this.run();
    }
    popFunction() {
        this.fns.pop();
        this.run();
    }
    run() {
        this.stop();
        this.interval = setInterval(() => {
            if (this.fns.length > 0) {
                this.fns.forEach(function (func) {
                    const f = func.fn.bind(func.scope);
                    f();
                })
            } else {
                return null;
            }
        }, 33.33);
    }
    stop() {
        clearInterval(this.interval);
        this.interval = null;
    }
}

class MouseHandler {
    constructor(playArea, iHandler) {
        this.playArea = playArea;
        this.iHandler = iHandler;
        this.mouseDownID = -1;
        this.mousePos = { x: 0, y: 0 };
        this.mouseDownPos = { x: 0, y: 0 };
        this.delta = { x: 0, y: 0 };
        this.tempCircle = new Circle("temp", 0, 0, 0);
        this.focusCircle = null;
        this.newCircleID = 0;
    }
    mouseMove(e) {
        this.mousePos.x = this.playArea.resizeRatio * (e.clientX - this.playArea.location.left);
        this.mousePos.y = this.playArea.resizeRatio * (e.clientY - this.playArea.location.top);
        if (this.mouseDownID == -1) {
            this.playArea.circles.forEach(circle => {
                if (vectorMagnitude(this.mousePos.x - circle.x, this.mousePos.y - circle.y) < circle.radius) {
                    circle.fillColor = "yellow"
                }
                else if (circle.fillColor == "yellow") {
                    circle.fillColor = "black";
                }
            })
        }
    }
    mouseDown(e) {
        if (this.mouseDownID == -1) {
            this.focusCircle = null;
            this.mouseDownPos.x = this.playArea.resizeRatio * (e.clientX - this.playArea.location.left);
            this.mouseDownPos.y = this.playArea.resizeRatio * (e.clientY - this.playArea.location.top);
            this.playArea.circles.forEach(circle => {
                if (vectorMagnitude(this.mousePos.x - circle.x, this.mousePos.y - circle.y) < circle.radius) {
                    this.mouseDownID = 1;
                    circle.fillColor = "yellow";
                    circle.draw(playArea.context);
                    this.focusCircle = circle;
                    this.iHandler.addFunction({ fn: this.mouseDownExistingCircle, scope: this });
                }
            })
            if (this.mouseDownID != 1) {
                this.mouseDownID = 0;
                this.iHandler.addFunction({ fn: this.mouseDownNewCircle, scope: this });
            }
        }
    }
    mouseUp(e) {
        if (this.mouseDownID != -1) {
            if (this.mouseDownID == 0) {
                this.playArea.circles.push(new Circle(this.newCircleID, this.tempCircle.x, this.tempCircle.y, this.tempCircle.radius, true));
                this.newCircleID += 1;
            }
            if (this.mouseDownID == 1) {
                const VELOCITY_COEFF = 100;
                const V_MAX = 300;
                let v_x = VELOCITY_COEFF * -this.delta.x / this.focusCircle.mass;
                let v_y = VELOCITY_COEFF * -this.delta.y / this.focusCircle.mass;
                const v = vectorMagnitude(v_x, v_y);
                if (v > V_MAX) {
                    const theta = Math.atan2(v_y, v_x);
                    v_x = V_MAX * Math.cos(theta);
                    v_y = V_MAX * Math.sin(theta);
                }
                this.focusCircle.setVelocity(v_x, v_y)
            }
            this.iHandler.popFunction();
            this.mouseDownID = -1;
        }
    }
    mouseDownNewCircle() {
        this.tempCircle.x = this.mouseDownPos.x;
        this.tempCircle.y = this.mouseDownPos.y;

        this.playArea.context.beginPath();
        this.playArea.context.arc(this.tempCircle.x, this.tempCircle.y, 2, 0, 2 * Math.PI);
        this.playArea.context.fill();
        this.playArea.context.stroke();

        this.delta.x = this.mousePos.x - this.mouseDownPos.x;
        this.delta.y = this.mousePos.y - this.mouseDownPos.y;
        this.tempCircle.radius = vectorMagnitude(this.delta.x, this.delta.y);

        this.playArea.context.beginPath();
        this.playArea.context.moveTo(this.tempCircle.x, this.tempCircle.y)
        this.playArea.context.lineTo(this.tempCircle.x + this.delta.x, this.tempCircle.y + this.delta.y)
        this.playArea.context.stroke();

        this.tempCircle.draw(playArea.context);
    }
    mouseDownExistingCircle() { //replace c with this.focusCircle        
        this.delta.x = this.mousePos.x - this.focusCircle.x;
        this.delta.y = this.mousePos.y - this.focusCircle.y

        canvas_arrow(this.playArea.context, this.focusCircle.x, this.focusCircle.y, this.focusCircle.x - this.delta.x, this.focusCircle.y - this.delta.y);
    }
}

function canvas_arrow(context, fromx, fromy, tox, toy) {
    var headlen = 20; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);
    context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    context.stroke();
}

function vectorMagnitude() {
    let output = 0;
    for (let i = 0; i < arguments.length; i++) {
        output += Math.pow(parseInt(arguments[i]), 2)
    }
    return Math.sqrt(output);
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

const PLAYAREAHTMLSIZE = 1000;
const playArea = new PlayArea(document.querySelector('#play-area'), PLAYAREAHTMLSIZE);
const iHandler = new IntervalHandler(playArea);
iHandler.addFunction({ fn: playArea.draw, scope: playArea });
const mHandler = new MouseHandler(playArea, iHandler);


window.addEventListener("resize", () => playArea.resize());
playArea.canvas.addEventListener("mousedown", (e) => mHandler.mouseDown(e));
playArea.canvas.addEventListener("mousemove", (e) => mHandler.mouseMove(e));
playArea.canvas.addEventListener("mouseup", (e) => mHandler.mouseUp(e));
playArea.canvas.addEventListener("mouseout", (e) => mHandler.mouseUp(e));