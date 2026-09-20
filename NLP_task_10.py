!pip install transformers sentencepiece torch -q

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Load English-Tamil translation model
model_name = "facebook/nllb-200-distilled-600M"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# English sentence
text = input("Enter English sentence: ")

# Convert English text into tokens
inputs = tokenizer(text, return_tensors="pt")

# Generate Tamil translation
translated = model.generate(
    **inputs,
    forced_bos_token_id=tokenizer.convert_tokens_to_ids("tam_Taml")
)

# Convert tokens back to text
result = tokenizer.decode(translated[0], skip_special_tokens=True)

print("Tamil Translation:", result)
