import IdeaForm from "@/components/IdeaForm";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-50 px-6 py-16">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Turn your business idea into a plan
        </h1>
        <p className="mt-2 text-zinc-600">
          Describe what you want to build. We&apos;ll ask a few quick questions, then generate a
          business plan tailored to the Nigerian market.
        </p>
      </div>

      <IdeaForm />
    </main>
  );
}
