import React, { useState, useEffect } from 'react';
import { BookOpen, Bookmark, GraduationCap, Plus, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import FlashcardForm from './FlashcardForm';
import { useNavigate } from 'react-router-dom';

// Define types for flashcards and decks
interface Flashcard {
  id: string;
  english: string;
  arabic: string;
  transliteration?: string;
  image_url?: string;
  audio_url?: string;
  tags?: string[];
}

interface Deck {
  id: string;
  name: string;
  description: string;
  emoji?: string;
  is_default: boolean;
  archived: boolean;
  created_at: string;
  cards?: Flashcard[];
}

// Icons based on deck type
const getDeckIcon = (deckId: string) => {
  if (deckId === 'verbs') {
    return <BookOpen className="w-6 h-6 text-emerald-600" />;
  } else if (deckId === 'nouns') {
    return <Bookmark className="w-6 h-6 text-emerald-600" />;
  } else if (deckId === 'learned') {
    return <GraduationCap className="w-6 h-6 text-emerald-600" />;
  } else {
    return <BookOpen className="w-6 h-6 text-gray-600" />;
  }
};

interface FlashcardDeckProps {
  setActiveTab: (tab: string) => void;
  setWordBankSubTab: (tab: string) => void;
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  setActiveTab,
  setWordBankSubTab,
}) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [showFlashcardForm, setShowFlashcardForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const navigate = useNavigate();

  // Load user's decks from Supabase
  const loadUserDecks = async () => {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error loading decks:', error);
    } else {
      setDecks(data as Deck[]);
    }
  };

  // Load flashcards for the selected deck
  const loadDeckData = async (deckId: string) => {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId);
    if (error) {
      console.error('Error loading flashcards:', error);
    } else {
      setDeckCards(data as Flashcard[]);
    }
  };

  useEffect(() => {
    loadUserDecks();
  }, []);

  useEffect(() => {
    if (selectedDeck) {
      loadDeckData(selectedDeck);
    }
  }, [selectedDeck]);

  const handleSaveNewDeck = async () => {
    if (!newDeckName.trim()) return; // require a deck name
    setError(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error: insertError } = await supabase
        .from('decks')
        .insert({
          user_id: session.user.id,
          name: newDeckName,
          description: newDeckDescription,
          emoji: '📚',
          is_default: false,
          archived: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setDecks((prev) => [...prev, data]);
      setIsCreatingNewDeck(false);
      setNewDeckName('');
      setNewDeckDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deck');
      console.error('Error creating deck:', err);
    }
  };

  // Filter flashcards based on search term
  const filteredCards = deckCards.filter((card) => {
    const term = searchTerm.toLowerCase();
    return (
      card.english.toLowerCase().includes(term) ||
      card.arabic.toLowerCase().includes(term) ||
      (card.transliteration &&
        card.transliteration.toLowerCase().includes(term)) ||
      (card.tags && card.tags.join(' ').toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-4">
      <button
        onClick={() => {
          setActiveTab('wordbank');
          setWordBankSubTab('add words');
        }}
        className="mb-6 text-emerald-600 dark:text-emerald-400 flex items-center"
      >
        ← Back to Vocabulary
      </button>
      <h2 className="text-xl font-bold mb-6">Flashcard Decks</h2>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* When a deck is selected, show back button and search bar */}
      {selectedDeck && (
        <div className="mb-4">
          <button
            onClick={() => {
              setSelectedDeck(null);
              setDeckCards([]);
            }}
            className="bg-gray-100 dark:bg-dark-100 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-dark-200"
          >
            Back to Decks
          </button>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search flashcards..."
            className="w-full p-2 mt-4 mb-4 border rounded dark:bg-dark-200 dark:border-gray-600"
          />
        </div>
      )}

      {/* Deck list and New Deck form when no deck is selected */}
      {!selectedDeck && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="bg-white dark:bg-dark-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-100 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
                onClick={() => setSelectedDeck(deck.id)}
              >
                <div className="flex items-center mb-3">
                  {getDeckIcon(deck.id)}
                  <h3 className="text-lg font-bold ml-2">{deck.name}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {deck.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button
              onClick={() => setIsCreatingNewDeck(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600"
            >
              Create New Deck
            </button>
          </div>
          {isCreatingNewDeck && (
            <div className="mb-4 p-4 border rounded-md mt-4 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
              <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">
                New Deck
              </h3>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  className="mt-1 block w-full border border-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300">
                  Description
                </label>
                <input
                  type="text"
                  value={newDeckDescription}
                  onChange={(e) => setNewDeckDescription(e.target.value)}
                  className="mt-1 block w-full border border-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md shadow-sm focus:outline-none focus:border-emerald-500 dark:focus:border-gray-700"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveNewDeck}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsCreatingNewDeck(false);
                    setNewDeckName('');
                    setNewDeckDescription('');
                  }}
                  className="bg-gray-300 dark:bg-gray-700 text-black dark:text-white px-4 py-2 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Flashcards view for a selected deck */}
      {selectedDeck && (
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold mb-4">Deck Cards</h3>

          {!showFlashcardForm && (
            <button
              onClick={() => setShowFlashcardForm(true)}
              className="mb-4 w-full p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center"
            >
              <Plus size={20} className="mr-2" />
              Add New Flashcard
            </button>
          )}

          {showFlashcardForm && (
            <div className="mb-6 bg-white dark:bg-dark-200 p-6 rounded-lg border border-gray-200 dark:border-dark-100">
              <FlashcardForm
                deckId={selectedDeck}
                onSuccess={() => {
                  setShowFlashcardForm(false);
                  loadDeckData(selectedDeck);
                }}
                onCancel={() => setShowFlashcardForm(false)}
              />
            </div>
          )}

          {filteredCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="relative p-4 bg-white dark:bg-dark-200 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer"
                  onClick={() =>
                    navigate(`/flashcard/${card.id}`, { replace: true })
                  }
                >
                  <div className="flex">
                    {card.image_url ? (
                      <img
                        src={card.image_url}
                        alt="Thumbnail"
                        className="object-cover rounded-md h-16 w-16"
                      />
                    ) : (
                      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md max-h-20 max-w-32">
                        <span className="text-gray-400 text-sm">No Image</span>
                      </div>
                    )}
                    <div className="ml-4 flex flex-col justify-center">
                      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {card.english}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {card.arabic}
                      </p>
                      {card.transliteration && (
                        <p className="text-sm italic text-gray-500 dark:text-gray-400">
                          {card.transliteration}
                        </p>
                      )}
                    </div>
                  </div>
                  {card.tags && card.tags.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tags: {card.tags.join(', ')}
                      </p>
                    </div>
                  )}
                  {card.audio_url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        new Audio(card.audio_url).play();
                      }}
                      className="absolute top-2 right-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full p-2 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No flashcards in this deck yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FlashcardDeck;


