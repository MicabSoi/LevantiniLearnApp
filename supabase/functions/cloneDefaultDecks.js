// cloneDefaultDecks.js
import { createClient } from '@supabase/supabase-js';

// Use your service role key (ensure this is kept secure)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    // Get the new user information from the request body
    const { user } = req.body;
    if (!user) {
      return res.status(400).json({ error: 'User data not provided' });
    }

    // 1. Fetch default decks
    const { data: defaultDecks, error: decksError } = await supabase
      .from('default_decks')
      .select('*');
    if (decksError) throw decksError;

    // 2. For each default deck, clone it for the new user
    for (const deck of defaultDecks) {
      const { data: newDeck, error: deckInsertError } = await supabase
        .from('decks')
        .insert({
          user_id: user.id,
          name: deck.name,
          description: deck.description,
          emoji: deck.emoji,
          is_default: true, // mark as a default copy
          archived: false,
        })
        .single();

      if (deckInsertError) {
        console.error('Error inserting deck:', deckInsertError);
        continue;
      }

      // 3. Clone the flashcards for this deck
      const { data: defaultFlashcards, error: flashcardsError } = await supabase
        .from('default_flashcards')
        .select('*')
        .eq('default_deck_id', deck.id);
      if (flashcardsError) {
        console.error('Error fetching default flashcards:', flashcardsError);
        continue;
      }

      for (const card of defaultFlashcards) {
        await supabase.from('flashcards').insert({
          deck_id: newDeck.id,
          front: card.front,
          back: card.back,
          transliteration: card.transliteration,
          image_url: card.image_url,
          audio_url: card.audio_url,
          tags: card.tags,
        });
      }
    }

    res.status(200).json({ message: 'Default decks cloned successfully.' });
  } catch (error) {
    console.error('Error cloning default decks:', error);
    res.status(500).json({ error: error.message });
  }
}


