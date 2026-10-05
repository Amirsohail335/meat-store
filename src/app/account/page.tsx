import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@lib/auth";
import { prisma } from "@lib/prisma";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const [user, addresses] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">My Account</h1>

      <div className="mb-6 rounded-lg border border-neutral-200 p-4">
        <h2 className="mb-2 font-semibold text-neutral-900">Profile</h2>
        <p className="text-sm text-neutral-600">Name: {user.name}</p>
        <p className="text-sm text-neutral-600">Email: {user.email}</p>
        <p className="text-sm text-neutral-600">Phone: {user.phone ?? "-"}</p>
      </div>

      <div className="mb-6 rounded-lg border border-neutral-200 p-4">
        <h2 className="mb-2 font-semibold text-neutral-900">Saved Addresses</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No saved addresses yet. They will appear here after your first
            order.
          </p>
        ) : (
          <ul className="space-y-2 text-sm text-neutral-600">
            {addresses.map((a) => (
              <li key={a.id} className="rounded border border-neutral-100 p-2">
                {a.line1}, {a.city}, {a.state} - {a.pincode}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-4">
        <Link
          href="/orders"
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          My Orders
        </Link>
        <Link
          href="/account/subscriptions"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          My Subscriptions
        </Link>
      </div>
    </div>
  );
}
