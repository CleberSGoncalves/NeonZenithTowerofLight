extends Node

## EventBus — Barramento Global de Eventos (Godot 4.7.2)
## UI e sistemas NUNCA se conectam diretamente a entidades.
## Toda comunicação entre jogador, inimigos e UI passa por aqui.

# ── Gameplay ──────────────────────────────────────────────────────
signal score_updated(new_score: int)
signal health_updated(current: int, maximum: int)
signal player_died()
signal level_completed(level_index: int)
signal checkpoint_reached(checkpoint_id: int)

# ── UI e Menus ────────────────────────────────────────────────────
signal hud_show_message(text: String, duration: float)
signal pause_requested()
signal resume_requested()

# ── Áudio ─────────────────────────────────────────────────────────
signal play_sfx(sfx_name: String)
signal play_music(track_name: String)
signal mute_toggled(is_muted: bool)

# ── Polish & Game Feel ────────────────────────────────────────────
signal stars_earned(level_index: int, star_count: int)
signal haptic_requested(duration_ms: int)
signal pacing_adjusted(new_coyote_time: float)

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func limpar_conexoes_ativas() -> void:
	# Desconecta ativamente ouvintes transitórios antes de reload da cena (libera GC do browser)
	var sinais: Array[Signal] = [
		score_updated, health_updated, player_died,
		level_completed, checkpoint_reached, hud_show_message,
		stars_earned, haptic_requested, pacing_adjusted
	]
	for sig in sinais:
		for conn in sig.get_connections():
			sig.disconnect(conn.callable)
