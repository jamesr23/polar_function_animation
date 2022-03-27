const canvas = document.getElementById("canv");
let ctx = canvas.getContext("2d");

const functions = [
    theta => 3 * Math.abs(Math.cos(4 * theta)),
    theta => Math.sqrt(9 * Math.sin(2 * theta)),
    theta => 2 * (1 - Math.sin(theta)),
    theta => 4 * Math.sin(3 * theta)
];

const defaults = {
    draw_r: true,
    draw_point: false,
    fill: false,
    grid: true,
    keypress: false,
    scale: 70,
    dtheta: 0.015,
    dtime: 1,
    range: 2,
    keypress_dtheta: 10,
    r_color: "#33d17a",
    f_color: "#1c71d8",
    r_width: 1, 
    f_width: 1,
    func: 0             // index
};

const opts = {...defaults};
var running = false,
    path = null,
    theta = 0;

{
    /*
    let w_width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        w_height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    */
    
    document.addEventListener("keypress", (e) => {
        if (running && opts.keypress && e.key === "Enter") {
            e.preventDefault();
            run_keypress();
        }
    });

    // correcting resolution
    let scale = window.devicePixelRatio, // always 2?
        width = 600,
        height = 600,
        scaled_width = Math.floor(width * scale),
        scaled_height = Math.floor(height * scale);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = scaled_width;
    canvas.height = scaled_height;

    // set default values
    
    // set default values
    document.getElementById("draw_r").checked = defaults.draw_r;
    document.getElementById("fill").checked = defaults.fill;
    document.getElementById("grid").checked = defaults.grid;
    document.getElementById("keypress").checked = defaults.keypress;
    document.getElementById("scale").value = defaults.scale;
    document.getElementById("dtheta").value = defaults.dtheta;
    document.getElementById("dtime").value = defaults.dtime;
    document.getElementById("range").value = defaults.range;
    document.getElementById("keypress_dtheta").value = defaults.keypress_dtheta;
    document.getElementById("r_color").value = defaults.r_color;
    document.getElementById("f_color").value = defaults.f_color;
    document.getElementById("r_width").value = defaults.r_width;
    document.getElementById("f_width").value = defaults.f_width;
    document.getElementById("func").value = defaults.func;
    let dropdown = document.querySelector("#func");
    for (let i in functions) {
        let opt = document.createElement("option");
        opt.value = i;
        opt.innerText = functions[i];
        dropdown.appendChild(opt);
    }
}

const offset = {
    x: canvas.width / 2,
    y: canvas.height / 2
};


draw_axis();

function translate(x, y) {
    return {
        x: offset.x + x * opts.scale,
        y: offset.y - y * opts.scale
    }
}

function toggle() {
    if (running) {
        running = false;
        document.getElementById("toggle").innerText = "start";
        return;
    }

    document.getElementById("toggle").innerText = "stop";

    running = true;
    theta = 0;
    path = new Path2D()

    // parse options
    opts.draw_r = document.getElementById("draw_r").checked;
    opts.fill = document.getElementById("fill").checked;
    opts.grid = document.getElementById("grid").checked;
    opts.keypress = document.getElementById("keypress").checked;
    opts.scale = parseFloat(document.getElementById("scale").value) || defaults.scale;
    opts.dtheta = parseFloat(document.getElementById("dtheta").value) || defaults.dtheta;
    opts.dtime = parseFloat(document.getElementById("dtime").value) || defaults.dtime;
    opts.range = parseFloat(document.getElementById("range").value) || defaults.range;
    opts.keypress_dtheta = parseFloat(document.getElementById("keypress_dtheta").value) || defaults.keypress_dtheta;
    opts.r_color = document.getElementById("r_color").value;
    opts.f_color = document.getElementById("f_color").value;
    opts.r_width = parseInt(document.getElementById("r_width").value) || defaults.r_width;
    opts.f_width = parseInt(document.getElementById("f_width").value) || defaults.f_width;
    opts.func = parseInt(document.getElementById("func").value) || defaults.func;

    if (opts.keypress) run_keypress()
    else draw();
}

function run_keypress() {
    for (let i = 0; i < opts.keypress_dtheta && theta <= opts.range * Math.PI; i++) {
        let r = functions[opts.func](theta),
            x = r * Math.cos(theta),
            y = r * Math.sin(theta);

        const {x: x_s, y: y_s} = translate(x, y);
        path.lineTo(x_s, y_s);
        path.endpoint = {x: x_s, y: y_s};
        theta += opts.dtheta;
    }
    render();
    let r = functions[opts.func](theta),
        x = r * Math.cos(theta),
        y = r * Math.sin(theta);
    update_values({
        func: functions[opts.func],
        theta: (theta / Math.PI).toFixed(2) + " π",
        r: r.toFixed(2),
        x: x.toFixed(2),
        y: y.toFixed(2),
    });
    if (theta > opts.range * Math.PI)
        running = false;
}

// calculate new values and draw
// setTimeout if not keypress.
function draw() {

    let r = functions[opts.func](theta),
        x = r * Math.cos(theta),
        y = r * Math.sin(theta);

    let values = {
        func: functions[opts.func],
        theta: (theta / Math.PI).toFixed(2) + " π",
        r: r.toFixed(2),
        x: x.toFixed(2),
        y: y.toFixed(2),
    };

    const {x: x_s, y: y_s} = translate(x, y);

    // update main function path 
    path.lineTo(x_s, y_s);
    path.endpoint = {x: x_s, y: y_s};

    render();

    update_values(values);
    theta += opts.dtheta;
    
    if (running && !opts.keypress && theta <= opts.range * Math.PI)
        window.setTimeout(draw, opts.dtime)
    else {
        running = false;
        document.getElementById("toggle").innerText = "start";
    }
}

function render() { 
        
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (opts.grid)
        draw_grid();
    
    draw_axis();

    ctx.strokeStyle = opts.f_color;
    ctx.fillStyle = opts.f_color;
    ctx.lineWidth = opts.f_width;

    // ctx.stroke(path);

    if (opts.fill) { 
        // create copy of main curve, go to 0, 0
        let pathfill = new Path2D(path);
        pathfill.lineTo(offset.x, offset.y);
        ctx.fill(pathfill);
    } else {
        ctx.stroke(path);
    }

    if (opts.draw_r) {
        ctx.strokeStyle = opts.r_color;
        ctx.lineWidth = opts.r_width;
        ctx.beginPath();
        ctx.moveTo(offset.x, offset.y);
        ctx.lineTo(path.endpoint.x, path.endpoint.y);
        ctx.stroke();
        ctx.closePath();
    }

}

function draw_axis() {

    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.stroke();
    ctx.closePath();
    ctx.lineWidth = 1;
}

function draw_grid() {

    ctx.strokeStyle = "#080808";
    ctx.lineWidth = 1;
    ctx.beginPath();

    let x = offset.x % opts.scale; while (x < canvas.width) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        x += opts.scale;
    }

    let y = offset.y % opts.scale;
    while (y < canvas.width) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        y += opts.scale;
    }
}

function update_values(obj) {
    let values = document.getElementById("values");
    values.innerHTML = "";
    for (const [key, value] of Object.entries(obj))
        values.innerHTML += key + ": " + value + "<br>";   
}