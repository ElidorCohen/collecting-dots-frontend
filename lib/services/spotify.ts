import { SpotifyApi } from '@spotify/web-api-ts-sdk';

interface PlaylistInfo {
  id: string;
  name: string;
  description: string;
  owner: {
    id: string;
    display_name: string;
  };
  followers: number;
  public: boolean;
  images: Array<{ url: string; height: number; width: number }>;
  external_urls: { spotify: string };
}

interface Track {
  added_at: string;
  track: {
    id: string;
    name: string;
    artists: Array<{ id: string; name: string }>;
    album: {
      id: string;
      name: string;
      images: Array<{ url: string; height: number; width: number }>;
      release_date: string;
    };
    duration_ms: number;
    explicit: boolean;
    popularity: number;
    preview_url: string | null;
    isrc: string | null;
    external_urls: { spotify: string };
  };
}

interface PlaylistData {
  playlist_info: PlaylistInfo;
  tracks: Track[];
  total_tracks: number;
  retrieved_at: string;
}

interface ArtistData {
  artist_name: string;
  artist_instagram_username: string;
  artist_soundcloud: string;
  artist_spotify: string;
  artist_beatport: string;
  image: string;
}

export class SpotifyService {
  private spotify: SpotifyApi;

  constructor() {
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify credentials are not configured');
    }

    this.spotify = SpotifyApi.withClientCredentials(
      process.env.SPOTIFY_CLIENT_ID,
      process.env.SPOTIFY_CLIENT_SECRET
    );
  }

  /**
   * Extracts playlist ID from Spotify URL or returns the ID if already provided
   */
  extractPlaylistId(playlistUrlOrId: string): string {
    // If it doesn't start with http, assume it's already an ID
    if (!playlistUrlOrId.startsWith('http')) {
      return playlistUrlOrId;
    }

    // Extract ID from URL using regex
    const match = playlistUrlOrId.match(/\/playlist\/([a-zA-Z0-9]+)/);
    if (!match) {
      throw new Error('Invalid Spotify playlist URL format');
    }

    return match[1];
  }

  /**
   * Extracts artist ID from Spotify URL or returns the ID if already provided
   */
  extractArtistId(artistUrlOrId: string): string {
    // If it doesn't start with http, assume it's already an ID
    if (!artistUrlOrId.startsWith('http')) {
      return artistUrlOrId;
    }

    // Extract ID from URL using regex
    const match = artistUrlOrId.match(/\/artist\/([a-zA-Z0-9]+)/);
    if (!match) {
      throw new Error('Invalid Spotify artist URL format');
    }

    return match[1];
  }

  /**
   * Fetches artist profile data from multiple artist objects with Spotify URLs
   * Enriches each artist with their Spotify profile image
   */
  async getArtistsData(artists: Array<{
    artist_name: string;
    artist_instagram_username: string;
    artist_soundcloud: string;
    artist_spotify: string;
    artist_beatport: string;
  }>): Promise<ArtistData[]> {
    try {
      const artistsData: ArtistData[] = [];

      for (const artistData of artists) {
        // Extract artist ID from Spotify URL
        const artistId = this.extractArtistId(artistData.artist_spotify);

        // Get artist information from Spotify
        const spotifyArtist = await this.spotify.artists.get(artistId);

        // Get the highest resolution image (first image is usually the highest res)
        const imageUrl = spotifyArtist.images && spotifyArtist.images.length > 0
          ? spotifyArtist.images[0].url
          : '';

        // Combine all data
        artistsData.push({
          artist_name: artistData.artist_name,
          artist_instagram_username: artistData.artist_instagram_username,
          artist_soundcloud: artistData.artist_soundcloud,
          artist_spotify: artistData.artist_spotify,
          artist_beatport: artistData.artist_beatport,
          image: imageUrl,
        });
      }

      return artistsData;
    } catch (error: any) {
      if (error.message?.includes('Invalid')) {
        throw error;
      }
      throw new Error(`Failed to fetch artist data: ${error.message}`);
    }
  }

  /**
   * Fetches complete playlist data including basic info and all tracks
   */
  async getPlaylistData(playlistUrl: string): Promise<PlaylistData> {
    try {
      // Extract playlist ID
      const playlistId = this.extractPlaylistId(playlistUrl);

      // Get basic playlist information
      const playlistInfo = await this.spotify.playlists.getPlaylist(playlistId);

      // Get all playlist tracks with pagination
      let offset = 0;
      const limit = 50;
      const allTracks: Track[] = [];

      while (true) {
        const response = await this.spotify.playlists.getPlaylistItems(
          playlistId,
          undefined,
          undefined,
          limit,
          offset
        );

        // Filter out null tracks (local files or unavailable tracks)
        const validTracks = response.items
          .filter((item: any) => item.track !== null)
          .map((item: any) => ({
            added_at: item.added_at,
            track: {
              id: item.track.id,
              name: item.track.name,
              artists: item.track.artists.map((artist: any) => ({
                id: artist.id,
                name: artist.name,
              })),
              album: {
                id: item.track.album.id,
                name: item.track.album.name,
                images: item.track.album.images.map((image: any) => ({
                  url: image.url,
                  height: image.height,
                  width: image.width,
                })),
                release_date: item.track.album.release_date,
              },
              duration_ms: item.track.duration_ms,
              explicit: item.track.explicit,
              popularity: item.track.popularity,
              preview_url: item.track.preview_url,
              isrc: item.track.external_ids?.isrc || null,
              external_urls: item.track.external_urls,
            },
          }));

        allTracks.push(...validTracks);

        // Check if there are more tracks to fetch
        if (response.next === null) break;
        offset += limit;
      }

      // Combine and return all data
      const playlistData: PlaylistData = {
        playlist_info: {
          id: playlistInfo.id,
          name: playlistInfo.name,
          description: playlistInfo.description || '',
          owner: {
            id: playlistInfo.owner.id,
            display_name: playlistInfo.owner.display_name || playlistInfo.owner.id,
          },
          followers: playlistInfo.followers?.total || 0,
          public: playlistInfo.public || false,
          images: playlistInfo.images.map((image: any) => ({
            url: image.url,
            height: image.height || 0,
            width: image.width || 0,
          })),
          external_urls: playlistInfo.external_urls,
        },
        tracks: allTracks,
        total_tracks: allTracks.length,
        retrieved_at: new Date().toISOString(),
      };

      return playlistData;
    } catch (error: any) {
      if (error.message?.includes('Invalid')) {
        throw error;
      }
      throw new Error(`Failed to fetch playlist data: ${error.message}`);
    }
  }
}
