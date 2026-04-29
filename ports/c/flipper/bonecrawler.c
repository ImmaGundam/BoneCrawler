#include <furi.h>
#include <gui/gui.h>
#include <gui/view_port.h>
#include <input/input.h>

#include <stdint.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

// BoneCrawler v1 — Flipper Zero starter port.
// Source game was HTML/JS canvas. This version uses Flipper GUI Canvas.
// Display target: 128x64, 1-bit monochrome.

#define GW 128
#define GH 64

// Play-field bounds.
// Original web version used 120x120 logic with a 17px HUD.
// Flipper uses 128x64, so the arena is compressed for the LCD.
#define PX 2
#define PY 12
#define PW 124
#define PH 50

#define MAX_ENEMIES 6

typedef enum {
    ScreenTitle,
    ScreenAbout,
    ScreenPlaying,
    ScreenGameOver,
} ScreenState;

typedef enum {
    DirDown,
    DirUp,
    DirLeft,
    DirRight,
} Direction;

typedef struct {
    int16_t x;
    int16_t y;
    int16_t w;
    int16_t h;
} Rect;

typedef struct {
    int16_t x;
    int16_t y;
    int16_t w;
    int16_t h;
    Direction dir;
    uint8_t hp;
    uint8_t atk_t;
    uint8_t atk_cd;
    uint8_t hurt_t;
    uint16_t walk_f;
    bool dead;
} Player;

typedef struct {
    int16_t x;
    int16_t y;
    int16_t w;
    int16_t h;
    Direction dir;
    uint8_t atk_t;
    uint8_t atk_cd;
    uint16_t walk_f;
    uint8_t move_period;
} Enemy;

typedef struct {
    Gui* gui;
    ViewPort* view_port;
    FuriMessageQueue* input_queue;

    ScreenState screen;
    Player player;
    Enemy enemies[MAX_ENEMIES];
    uint8_t enemy_count;

    uint32_t frame;
    uint32_t rng;
    uint16_t score;
    uint16_t spawn_timer;

    bool key_left;
    bool key_right;
    bool key_up;
    bool key_down;
    bool attack_queued;
    bool exit_requested;
    uint8_t title_selection;
} BoneCrawlerApp;

// Sprite values:
// 0 = transparent
// 1 = light shade, dithered
// 2 = medium shade, black
// 3 = dark shade, black
static const uint8_t SPR_PLR_D[8][8] = {
    {0,0,2,3,3,2,0,0},
    {0,0,3,1,1,3,0,0},
    {0,0,2,3,3,2,0,0},
    {0,2,3,3,3,3,2,0},
    {0,0,3,3,3,0,0,0},
    {0,0,3,2,2,3,0,0},
    {0,0,3,0,0,3,0,0},
    {0,0,0,0,0,0,0,0},
};

static const uint8_t SPR_PLR_U[8][8] = {
    {0,0,2,3,3,2,0,0},
    {0,0,3,3,3,3,0,0},
    {0,0,2,3,3,2,0,0},
    {0,2,3,3,3,3,2,0},
    {0,0,3,3,3,0,0,0},
    {0,0,3,2,2,3,0,0},
    {0,0,3,0,0,3,0,0},
    {0,0,0,0,0,0,0,0},
};

static const uint8_t SPR_PLR_R[8][8] = {
    {0,0,2,3,3,0,0,0},
    {0,0,3,1,3,0,0,0},
    {0,0,2,3,3,0,0,0},
    {0,2,3,3,3,3,2,0},
    {0,0,3,3,3,0,0,0},
    {0,0,3,2,3,0,0,0},
    {0,0,3,0,3,0,0,0},
    {0,0,0,0,0,0,0,0},
};

static const uint8_t SPR_PLR_L[8][8] = {
    {0,0,0,3,3,2,0,0},
    {0,0,0,3,1,3,0,0},
    {0,0,0,3,3,2,0,0},
    {0,2,3,3,3,3,2,0},
    {0,0,0,3,3,3,0,0},
    {0,0,0,3,2,3,0,0},
    {0,0,0,3,0,3,0,0},
    {0,0,0,0,0,0,0,0},
};

static const uint8_t SPR_SKE[8][8] = {
    {0,0,2,2,2,0,0,0},
    {0,2,3,1,3,2,0,0},
    {0,2,3,3,3,2,0,0},
    {0,0,2,3,2,0,0,0},
    {0,2,3,3,3,2,0,0},
    {0,0,2,2,2,0,0,0},
    {0,0,3,0,3,0,0,0},
    {0,2,3,0,3,2,0,0},
};

static const uint8_t SPR_SKE_A[8][8] = {
    {0,0,2,2,2,0,0,0},
    {0,2,3,3,3,2,0,0},
    {0,2,3,2,3,2,0,0},
    {0,0,2,3,2,0,0,0},
    {3,3,3,3,3,2,0,0},
    {0,0,2,2,2,0,0,0},
    {0,0,3,0,3,0,0,0},
    {0,2,3,0,3,2,0,0},
};

static const uint8_t SPR_H_FULL[6][8] = {
    {0,2,2,0,2,2,0,0},
    {2,3,3,2,3,3,2,0},
    {2,3,3,3,3,3,2,0},
    {0,2,3,3,3,2,0,0},
    {0,0,2,3,2,0,0,0},
    {0,0,0,2,0,0,0,0},
};

static const uint8_t SPR_H_HALF[6][8] = {
    {0,2,2,0,1,1,0,0},
    {2,3,3,2,1,2,1,0},
    {2,3,3,2,1,1,1,0},
    {0,2,3,2,1,1,0,0},
    {0,0,2,2,1,0,0,0},
    {0,0,0,2,0,0,0,0},
};

static const uint8_t SPR_H_EMPTY[6][8] = {
    {0,1,1,0,1,1,0,0},
    {1,2,2,1,2,2,1,0},
    {1,2,2,2,2,2,1,0},
    {0,1,2,2,2,1,0,0},
    {0,0,1,2,1,0,0,0},
    {0,0,0,1,0,0,0,0},
};

static const uint8_t SPR_SKULL[12][12] = {
    {0,0,0,1,1,1,1,1,1,0,0,0},
    {0,0,1,2,2,2,2,2,2,1,0,0},
    {0,1,2,3,2,2,2,2,3,2,1,0},
    {0,1,2,2,3,2,2,3,2,2,1,0},
    {0,1,2,2,2,2,2,2,2,2,1,0},
    {0,0,1,2,3,2,2,3,2,1,0,0},
    {0,0,1,2,2,3,3,2,2,1,0,0},
    {0,0,0,1,2,2,2,2,1,0,0,0},
    {0,0,0,1,2,1,1,2,1,0,0,0},
    {0,0,0,0,1,0,0,1,0,0,0,0},
    {0,0,0,0,1,0,0,1,0,0,0,0},
    {0,0,0,0,0,0,0,0,0,0,0,0},
};

static uint32_t rng_next(BoneCrawlerApp* app) {
    uint32_t x = app->rng ? app->rng : 0xA53C9E21;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    app->rng = x;
    return x;
}

static int16_t rng_range(BoneCrawlerApp* app, int16_t min, int16_t max) {
    if(max <= min) return min;
    return min + (int16_t)(rng_next(app) % (uint32_t)(max - min + 1));
}

static int16_t isign(int16_t v) {
    return (v > 0) - (v < 0);
}

static bool rect_overlap(Rect a, Rect b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

static Rect attack_box(const Player* p, int16_t reach) {
    if(p->dir == DirRight) return (Rect){p->x + p->w, p->y + 1, reach, p->h - 2};
    if(p->dir == DirLeft) return (Rect){p->x - reach, p->y + 1, reach, p->h - 2};
    if(p->dir == DirUp) return (Rect){p->x + 1, p->y - reach, p->w - 2, reach};
    return (Rect){p->x + 1, p->y + p->h, p->w - 2, reach};
}

static uint8_t max_enemies_for_score(uint16_t score) {
    uint8_t count = 1 + (score / 4);
    return count > MAX_ENEMIES ? MAX_ENEMIES : count;
}

static void draw_sprite(
    Canvas* canvas,
    const uint8_t* sprite,
    uint8_t rows,
    uint8_t cols,
    int16_t lx,
    int16_t ly,
    bool flip_x,
    uint32_t frame) {
    canvas_set_color(canvas, ColorBlack);

    for(uint8_t r = 0; r < rows; r++) {
        for(uint8_t c = 0; c < cols; c++) {
            uint8_t sx = flip_x ? (cols - 1 - c) : c;
            uint8_t v = sprite[r * cols + sx];
            if(!v) continue;

            int16_t px = lx + c;
            int16_t py = ly + r;
            if(px < 0 || py < 0 || px >= GW || py >= GH) continue;

            // Flipper LCD is 1-bit. Preserve the old 4-shade feel with dither.
            if(v == 1 && ((px + py + (int16_t)frame) & 1)) continue;
            canvas_draw_dot(canvas, px, py);
        }
    }
}

static void reset_game(BoneCrawlerApp* app) {
    memset(&app->player, 0, sizeof(app->player));
    memset(app->enemies, 0, sizeof(app->enemies));

    app->player.x = GW / 2 - 4;
    app->player.y = PY + PH / 2;
    app->player.w = 8;
    app->player.h = 8;
    app->player.dir = DirDown;
    app->player.hp = 6;

    app->enemy_count = 0;
    app->frame = 0;
    app->score = 0;
    app->spawn_timer = 18;
    app->attack_queued = false;

    app->screen = ScreenPlaying;
}

static void spawn_enemy(BoneCrawlerApp* app) {
    if(app->enemy_count >= MAX_ENEMIES) return;

    Enemy* e = &app->enemies[app->enemy_count++];
    memset(e, 0, sizeof(Enemy));
    e->w = 8;
    e->h = 8;
    e->dir = DirLeft;
    e->atk_cd = 40 + (rng_next(app) % 40);

    if(app->score > 18) e->move_period = 1;
    else if(app->score > 10) e->move_period = 2;
    else if(app->score > 4) e->move_period = 3;
    else e->move_period = 4;

    uint8_t side = rng_next(app) & 3;
    if(side == 0) {
        e->x = rng_range(app, PX, PX + PW - 8);
        e->y = PY - 8;
    } else if(side == 1) {
        e->x = PX + PW;
        e->y = rng_range(app, PY, PY + PH - 8);
    } else if(side == 2) {
        e->x = rng_range(app, PX, PX + PW - 8);
        e->y = PY + PH;
    } else {
        e->x = PX - 8;
        e->y = rng_range(app, PY, PY + PH - 8);
    }
}

static void remove_enemy(BoneCrawlerApp* app, uint8_t index) {
    if(index >= app->enemy_count) return;
    for(uint8_t i = index; i + 1 < app->enemy_count; i++) {
        app->enemies[i] = app->enemies[i + 1];
    }
    app->enemy_count--;
}

static void update_game(BoneCrawlerApp* app) {
    if(app->screen != ScreenPlaying) return;

    app->frame++;
    Player* p = &app->player;

    if(app->spawn_timer > 0) {
        app->spawn_timer--;
    } else if(app->enemy_count < max_enemies_for_score(app->score)) {
        spawn_enemy(app);
        uint16_t delay = 34;
        if(app->score > 12) delay = 24;
        if(app->score > 24) delay = 16;
        app->spawn_timer = delay;
    }

    if(!p->dead) {
        int16_t dx = 0;
        int16_t dy = 0;

        if(app->key_left) {
            dx--;
            p->dir = DirLeft;
        }
        if(app->key_right) {
            dx++;
            p->dir = DirRight;
        }
        if(app->key_up) {
            dy--;
            p->dir = DirUp;
        }
        if(app->key_down) {
            dy++;
            p->dir = DirDown;
        }

        // Keep diagonal motion from being too fast on a tiny screen.
        if(dx && dy && (app->frame & 1)) dx = 0;

        p->x += dx;
        p->y += dy;
        if(p->x < PX) p->x = PX;
        if(p->y < PY) p->y = PY;
        if(p->x > PX + PW - p->w) p->x = PX + PW - p->w;
        if(p->y > PY + PH - p->h) p->y = PY + PH - p->h;
        if(dx || dy) p->walk_f++;

        if(app->attack_queued && p->atk_cd == 0 && p->atk_t == 0) {
            p->atk_t = 6;
            p->atk_cd = 12;
            Rect box = attack_box(p, 10);

            for(int8_t i = (int8_t)app->enemy_count - 1; i >= 0; i--) {
                Enemy* e = &app->enemies[i];
                if(rect_overlap(box, (Rect){e->x, e->y, e->w, e->h})) {
                    remove_enemy(app, (uint8_t)i);
                    app->score++;
                }
            }
        }
        app->attack_queued = false;

        if(p->atk_t > 0) p->atk_t--;
        if(p->atk_cd > 0) p->atk_cd--;
        if(p->hurt_t > 0) p->hurt_t--;
    }

    for(uint8_t i = 0; i < app->enemy_count; i++) {
        Enemy* e = &app->enemies[i];
        if(e->atk_t > 0) e->atk_t--;
        if(e->atk_cd > 0) e->atk_cd--;
        e->walk_f++;

        int16_t ecx = e->x + 4;
        int16_t ecy = e->y + 4;
        int16_t pcx = p->x + 4;
        int16_t pcy = p->y + 4;
        int16_t ddx = pcx - ecx;
        int16_t ddy = pcy - ecy;

        if(abs(ddx) > abs(ddy)) e->dir = ddx > 0 ? DirRight : DirLeft;
        else e->dir = ddy > 0 ? DirDown : DirUp;

        bool near = rect_overlap(
            (Rect){e->x - 2, e->y - 2, e->w + 4, e->h + 4},
            (Rect){p->x, p->y, p->w, p->h});

        if(near) {
            if(e->atk_cd == 0 && !p->dead) {
                e->atk_t = 8;
                e->atk_cd = 45;
                if(p->hurt_t == 0) {
                    if(p->hp > 0) p->hp--;
                    p->hurt_t = 24;
                    if(p->hp == 0) {
                        p->dead = true;
                        app->screen = ScreenGameOver;
                    }
                }
            }
        } else if((app->frame % e->move_period) == 0) {
            if(abs(ddx) > abs(ddy)) e->x += isign(ddx);
            else e->y += isign(ddy);
        }
    }
}

static void draw_hud(BoneCrawlerApp* app, Canvas* canvas) {
    Player* p = &app->player;
    for(uint8_t i = 0; i < 3; i++) {
        uint8_t rem = 0;
        if(p->hp > i * 2) rem = p->hp - i * 2;
        if(rem > 2) rem = 2;
        const uint8_t* heart = rem >= 2 ? &SPR_H_FULL[0][0] : (rem == 1 ? &SPR_H_HALF[0][0] : &SPR_H_EMPTY[0][0]);
        draw_sprite(canvas, heart, 6, 8, 3 + i * 10, 2, false, app->frame);
    }

    char score_buf[16];
    snprintf(score_buf, sizeof(score_buf), "%u", app->score);
    canvas_set_font(canvas, FontSecondary);
    canvas_set_color(canvas, ColorBlack);
    canvas_draw_str(canvas, 105, 8, score_buf);
}

static void render_play(BoneCrawlerApp* app, Canvas* canvas) {
    Player* p = &app->player;
    canvas_set_color(canvas, ColorBlack);

    draw_hud(app, canvas);

    canvas_draw_frame(canvas, PX - 1, PY - 1, PW + 2, PH + 2);
    canvas_draw_line(canvas, PX - 1, PY - 3, PX + PW, PY - 3);

    for(uint8_t i = 0; i < app->enemy_count; i++) {
        Enemy* e = &app->enemies[i];
        int16_t bob = (e->walk_f / 10) & 1;
        const uint8_t* spr = e->atk_t ? &SPR_SKE_A[0][0] : &SPR_SKE[0][0];
        draw_sprite(canvas, spr, 8, 8, e->x, e->y + bob, e->dir == DirRight, app->frame);
    }

    bool flash = p->hurt_t > 0 && ((p->hurt_t / 3) & 1);
    if(!flash) {
        const uint8_t* pspr = &SPR_PLR_D[0][0];
        if(p->dir == DirUp) pspr = &SPR_PLR_U[0][0];
        else if(p->dir == DirLeft) pspr = &SPR_PLR_L[0][0];
        else if(p->dir == DirRight) pspr = &SPR_PLR_R[0][0];

        bool moving = app->key_left || app->key_right || app->key_up || app->key_down;
        int16_t bob = moving ? ((p->walk_f / 8) & 1) : 0;
        draw_sprite(canvas, pspr, 8, 8, p->x, p->y + bob, false, app->frame);

        if(p->atk_t > 0) {
            Rect box = attack_box(p, 10);
            canvas_set_color(canvas, ColorBlack);
            canvas_draw_frame(canvas, box.x, box.y, box.w, box.h);
        }
    }
}

static void draw_centered_str(Canvas* canvas, int16_t center_x, int16_t baseline_y, const char* text) {
    uint16_t width = canvas_string_width(canvas, text);
    canvas_draw_str(canvas, center_x - (width / 2), baseline_y, text);
}

static void draw_title_menu_item(
    BoneCrawlerApp* app,
    Canvas* canvas,
    uint8_t index,
    int16_t y,
    const char* text) {
    uint16_t width = canvas_string_width(canvas, text);
    int16_t x = (GW / 2) - (width / 2);

    if(app->title_selection == index) {
        canvas_draw_str(canvas, x - 10, y, ">");
    }
    canvas_draw_str(canvas, x, y, text);
}

static void render_title(BoneCrawlerApp* app, Canvas* canvas) {
    canvas_set_color(canvas, ColorBlack);
    draw_sprite(canvas, &SPR_SKULL[0][0], 12, 12, 6, 5, false, app->frame);
    draw_sprite(canvas, &SPR_SKULL[0][0], 12, 12, 110, 5, false, app->frame);

    // Keep the game title as one centered word.
    canvas_set_font(canvas, FontPrimary);
    draw_centered_str(canvas, GW / 2, 27, "BONECRAWLER");

    canvas_set_font(canvas, FontSecondary);
    draw_title_menu_item(app, canvas, 0, 45, "START");
    draw_title_menu_item(app, canvas, 1, 57, "ABOUT");
}

static void render_about(Canvas* canvas) {
    canvas_set_color(canvas, ColorBlack);
    canvas_draw_frame(canvas, 0, 0, GW, GH);

    canvas_set_font(canvas, FontPrimary);
    draw_centered_str(canvas, GW / 2, 10, "ABOUT");

    canvas_set_font(canvas, FontSecondary);
    canvas_draw_str(canvas, 5, 24, "BoneCrawler v1");
    canvas_draw_str(canvas, 5, 34, "by ImmaGundam");
    canvas_draw_str(canvas, 5, 44, "github.com/ImmaGundam");
    canvas_draw_str(canvas, 5, 53, "BoneCrawler.com");
}

static void render_game_over(BoneCrawlerApp* app, Canvas* canvas) {
    render_play(app, canvas);

    canvas_set_color(canvas, ColorWhite);
    canvas_draw_box(canvas, 20, 17, 88, 34);
    canvas_set_color(canvas, ColorBlack);
    canvas_draw_frame(canvas, 20, 17, 88, 34);

    canvas_set_font(canvas, FontPrimary);
    canvas_draw_str(canvas, 35, 31, "GAME OVER");

    char score_buf[24];
    snprintf(score_buf, sizeof(score_buf), "KILLS: %u", app->score);
    canvas_set_font(canvas, FontSecondary);
    canvas_draw_str(canvas, 38, 45, score_buf);
}

static void draw_callback(Canvas* canvas, void* context) {
    BoneCrawlerApp* app = context;
    canvas_clear(canvas);

    if(app->screen == ScreenTitle) render_title(app, canvas);
    else if(app->screen == ScreenAbout) render_about(canvas);
    else if(app->screen == ScreenGameOver) render_game_over(app, canvas);
    else render_play(app, canvas);
}

static void input_callback(InputEvent* input_event, void* context) {
    BoneCrawlerApp* app = context;
    furi_message_queue_put(app->input_queue, input_event, 0);
}

static void process_input(BoneCrawlerApp* app, const InputEvent* event) {
    bool pressed = event->type == InputTypePress || event->type == InputTypeRepeat;
    bool released = event->type == InputTypeRelease;

    if(event->type == InputTypePress && event->key == InputKeyBack) {
        if(app->screen == ScreenAbout) {
            app->screen = ScreenTitle;
            return;
        }
        app->exit_requested = true;
        return;
    }

    if(app->screen == ScreenTitle) {
        if(event->type == InputTypePress) {
            if(event->key == InputKeyUp || event->key == InputKeyDown) {
                app->title_selection = app->title_selection ? 0 : 1;
                return;
            }
            if(event->key == InputKeyOk) {
                if(app->title_selection == 0) reset_game(app);
                else app->screen = ScreenAbout;
                return;
            }
        }
        return;
    }

    if(app->screen == ScreenAbout) {
        if(event->type == InputTypePress && event->key == InputKeyOk) {
            app->screen = ScreenTitle;
        }
        return;
    }

    if(app->screen == ScreenGameOver) {
        if(event->type == InputTypePress && event->key == InputKeyOk) {
            reset_game(app);
        }
        return;
    }

    if(event->key == InputKeyLeft) {
        if(pressed) app->key_left = true;
        if(released) app->key_left = false;
    } else if(event->key == InputKeyRight) {
        if(pressed) app->key_right = true;
        if(released) app->key_right = false;
    } else if(event->key == InputKeyUp) {
        if(pressed) app->key_up = true;
        if(released) app->key_up = false;
    } else if(event->key == InputKeyDown) {
        if(pressed) app->key_down = true;
        if(released) app->key_down = false;
    } else if(event->key == InputKeyOk && event->type == InputTypePress) {
        app->attack_queued = true;
    }
}

int32_t bonecrawler_app(void* p) {
    UNUSED(p);

    BoneCrawlerApp* app = malloc(sizeof(BoneCrawlerApp));
    furi_check(app);
    memset(app, 0, sizeof(BoneCrawlerApp));

    app->screen = ScreenTitle;
    app->title_selection = 0;
    app->rng = furi_get_tick() ^ 0xB0C0CAFE;

    app->input_queue = furi_message_queue_alloc(16, sizeof(InputEvent));
    app->view_port = view_port_alloc();

    view_port_draw_callback_set(app->view_port, draw_callback, app);
    view_port_input_callback_set(app->view_port, input_callback, app);

    app->gui = furi_record_open(RECORD_GUI);
    gui_add_view_port(app->gui, app->view_port, GuiLayerFullscreen);

    while(!app->exit_requested) {
        InputEvent event;
        while(furi_message_queue_get(app->input_queue, &event, 0) == FuriStatusOk) {
            process_input(app, &event);
        }

        update_game(app);
        view_port_update(app->view_port);
        furi_delay_ms(33); // about 30 FPS
    }

    gui_remove_view_port(app->gui, app->view_port);
    furi_record_close(RECORD_GUI);

    view_port_free(app->view_port);
    furi_message_queue_free(app->input_queue);
    free(app);

    return 0;
}
