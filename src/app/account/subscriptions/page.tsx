"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";

type Address = { id: string; line1: string; city: string; pincode: string };
type Variant = { id: string; weightLabel: string; price: number };
type ProductOption = { id: string; name: string; variants: Variant[] };
type Subscription = {
  id: string;
  active: boolean;
  frequencyDays: number;
  quantity: number;
  nextDeliveryDate: string;
  product: { name: string };
  variant: { weightLabel: string; price: number };
  address: { line1: string; city: string };
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [addressId, setAddressId] = useState("");
  const [frequencyDays, setFrequencyDays] = useState(7);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  async function load() {
    const [subsRes, addrsRes, prodRes] = await Promise.all([
      fetch("/api/subscriptions"),
      fetch("/api/addresses"),
      fetch("/api/products"),
    ]);
    setSubscriptions(await subsRes.json());
    setAddresses(await addrsRes.json());
    setProducts(await prodRes.json());
  }

  useEffect(() => {
    load();
  }, []);

  const selectedProduct = products.find((p) => p.id === productId);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!productId || !variantId || !addressId) {
      setMessage("Please select a product, weight and delivery address.");
      return;
    }

    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId, addressId, frequencyDays, quantity }),
    });
    if (!res.ok) {
      setMessage("Could not create the subscription.");
      return;
    }
    setProductId("");
    setVariantId("");
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/subscriptions/${id} `, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    load();
  }

  async function cancelSubscription(id: string) {
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">My Subscriptions</h1>

      <form onSubmit={handleCreate} className="mb-8 space-y-3 rounded-lg border border-neutral-200 p-4">
        <h2 className="font-semibold text-neutral-900">Set up a new subscription</h2>
        
        <select
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setVariantId("");
          }}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Select a product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {selectedProduct && (
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Select weight</option>
            {selectedProduct.variants.map((v) => (
              <option key={v.id} value={v.id}>{v.weightLabel} - {formatCurrency(v.price)}</option>
            ))}
          </select>
        )}

        <select
          value={addressId}
          onChange={(e) => setAddressId(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Select delivery address</option>
          {addresses.map((a) => (
            <option key={a.id} value={a.id}>{a.line1}, {a.city} - {a.pincode}</option>
          ))}
        </select>
        {addresses.length === 0 && (
          <p className="text-xs text-neutral-500">Place an order first to save a delivery address.</p>
        )}

        <div className="flex gap-3">
          <select
            value={frequencyDays}
            onChange={(e) => setFrequencyDays(Number(e.target.value))}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value={7}>Weekly</option>
            <option value={14}>Every 2 weeks</option>
            <option value={30}>Monthly</option>
          </select>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {message && <p className="text-sm text-red-600">{message}</p>}

        <button className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800">
          Subscribe
        </button>
      </form>

      <div className="space-y-3">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-900">
                {sub.product.name} ({sub.variant.weightLabel}) x {sub.quantity}
              </span>
              <span className={`text-xs font-semibold ${sub.active ? "text-green-600" : "text-neutral-400"}`}>
                {sub.active ? "Active" : "Paused"}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Every {sub.frequencyDays} days to {sub.address.line1}, {sub.address.city}
            </p>
            <p className="text-sm text-neutral-500">
              Next delivery: {new Date(sub.nextDeliveryDate).toLocaleDateString()}
            </p>
            <div className="mt-2 flex gap-3">
              <button
                onClick={() => toggleActive(sub.id, !sub.active)}
                className="text-sm font-medium text-red-700 hover:underline"
              >
                {sub.active ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => cancelSubscription(sub.id)}
                className="text-sm font-medium text-neutral-400 hover:text-red-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
        {subscriptions.length === 0 && (
        <p className="text-neutral-500">You have no active subscriptions.</p>
        )}
        </div>
    </div>
  );
}