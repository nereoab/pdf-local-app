'use client';

import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 space-y-4" aria-hidden="true" role="status">
      <motion.div
        className="h-4 w-16 bg-zinc-800 rounded"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      />
      <motion.div
        className="h-6 w-3/4 bg-zinc-800 rounded-md"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.1 }}
      />
      <motion.div
        className="h-3 w-full bg-zinc-800 rounded"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.2 }}
      />
      <motion.div
        className="h-3 w-2/3 bg-zinc-800 rounded"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.3 }}
      />
      <div className="grid grid-cols-2 gap-1.5 pt-2">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="h-6 bg-zinc-800 rounded"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.1 * i }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonBar() {
  return (
    <motion.div
      className="h-4 bg-zinc-800 rounded-full w-full"
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      aria-hidden="true"
      role="status"
    />
  );
}

export function SkeletonTableRow() {
  return (
    <tr aria-hidden="true" role="status">
      <td className="py-3.5 pl-2">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-9 h-9 bg-zinc-800 rounded-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <motion.div
            className="h-3 w-32 bg-zinc-800 rounded"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.1 }}
          />
        </div>
      </td>
      <td className="py-3.5">
        <motion.div
          className="h-3 w-16 bg-zinc-800 rounded"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
        />
      </td>
      <td className="py-3.5">
        <motion.div
          className="h-3 w-24 bg-zinc-800 rounded"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
        />
      </td>
      <td className="py-3.5">
        <motion.div
          className="h-6 w-20 bg-zinc-800 rounded-full"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
        />
      </td>
      <td className="py-3.5 pr-2">
        <div className="flex justify-end gap-1">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="w-7 h-7 bg-zinc-800 rounded-lg"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.1 * i }}
            />
          ))}
        </div>
      </td>
    </tr>
  );
}