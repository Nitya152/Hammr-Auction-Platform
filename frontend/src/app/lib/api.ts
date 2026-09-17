const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function getAuctions() {
  const response = await fetch(`${API_URL}/auctions`);

  if (!response.ok) {
    throw new Error("Failed to fetch auctions");
  }

  return response.json();
}
