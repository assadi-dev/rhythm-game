import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioDir  = path.join(__dirname, '../../assets/audio');

// Crée le dossier si absent
if (!existsSync(audioDir)) mkdirSync(audioDir, { recursive: true });

// Stockage disque — le songId vient de :songId dans l'URL
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, audioDir),
  filename: (req, _file, cb) => {
    const songId = sanitizeId(String(req.params.songId ?? 'unknown'));
    cb(null, `${songId}.mp3`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === 'audio/mpeg' ||
      file.mimetype === 'audio/mp3'  ||
      file.originalname.toLowerCase().endsWith('.mp3');
    ok ? cb(null, true) : cb(new Error('Seuls les fichiers MP3 sont acceptés'));
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
});

export const uploadRouter = Router();

/**
 * POST /api/upload/audio/:songId
 *
 * Multipart/form-data — champ : audio (fichier MP3)
 * Le fichier est enregistré sous backend/assets/audio/{songId}.mp3
 *
 * Exemple curl :
 *   curl -X POST http://localhost:3001/api/upload/audio/demo \
 *        -F "audio=@/chemin/vers/demo.mp3"
 */
uploadRouter.post(
  '/audio/:songId',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('audio')(req, res, (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : 'Erreur upload';
        res.status(400).json({ error: msg });
        return;
      }
      next();
    });
  },
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier audio fourni (champ attendu : "audio")' });
      return;
    }
    const songId = sanitizeId(String(req.params.songId));
    res.status(201).json({
      ok:       true,
      songId,
      filename: req.file.filename,
      size:     req.file.size,
      url:      `/audio/${songId}.mp3`,
    });
  },
);

function sanitizeId(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}
